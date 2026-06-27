import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { Canvas as FabricCanvas, Textbox, FabricObject } from "fabric";
import { firstValueFrom } from "rxjs";
import { ProductService } from "../../../core/services/product.service";
import { FabricDesignStateService } from "./services/fabric-design-state.service";
import { FabricImageLayerService } from "./services/fabric-image-layer.service";
import { FabricPrintableZoneConstraintService } from "./services/fabric-printable-zone-constraint.service";
import { FabricTextLayerService } from "./services/fabric-text-layer.service";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-design-canvas",
  standalone: true,
  templateUrl: "./design-canvas.component.html",
  styleUrl: "./design-canvas.component.scss",
})
export class DesignCanvasComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() imageUrl = "";
  @Input() alt = "Design preview";
  @Input() viewAngle: "front" | "back" = "front";
  @Input() printableZone: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null = null;

  @ViewChild("fabricCanvas", { static: false })
  fabricCanvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild("previewImage", { static: false })
  previewImageRef!: ElementRef<HTMLImageElement>;

  @ViewChild("canvasHost", { static: false })
  canvasHostRef!: ElementRef<HTMLDivElement>;

  @ViewChild("imageInput", { static: false })
  imageInputRef!: ElementRef<HTMLInputElement>;

  readonly fontFamilies = [
    "Inter, sans-serif",
    "Arial, sans-serif",
    "Georgia, serif",
    "Times New Roman, serif",
    "Courier New, monospace",
  ];

  selectedTextValue = "";
  fontSize = 28;
  fontFamily = "Inter, sans-serif";
  textColor = "#ffffff";
  hasSelection = false;

  private fabricCanvas?: FabricCanvas;
  private resizeObserver?: ResizeObserver;
  private resizeFrame = 0;
  private pendingConstraintFrame = 0;
  private readonly keyboardHandler = (event: KeyboardEvent) => {
    this.handleKeyboardShortcut(event);
  };

  constructor(
    private readonly textLayerService: FabricTextLayerService,
    private readonly imageLayerService: FabricImageLayerService,
    private readonly stateService: FabricDesignStateService,
    private readonly constraintService: FabricPrintableZoneConstraintService,
    private readonly productService: ProductService,
    private readonly toastService: ToastService,
  ) {}

  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.setupResizeObserver();
    requestAnimationFrame(() => this.syncCanvasSize());
    this.bindCanvasEvents();
    window.addEventListener("keydown", this.keyboardHandler);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["imageUrl"] && !changes["imageUrl"].firstChange) {
      console.log(`[Fabric] ngOnChanges imageUrl`, {
        imageUrl: this.imageUrl,
      });
      requestAnimationFrame(() => this.syncCanvasSize());
    }

    if (changes["viewAngle"] && !changes["viewAngle"].firstChange) {
      const previousView = changes["viewAngle"].previousValue as
        | "front"
        | "back"
        | undefined;

      console.log(`[Fabric] ngOnChanges viewAngle`, {
        previousView,
        currentView: this.viewAngle,
      });

      requestAnimationFrame(() => {
        this.switchView(this.viewAngle, previousView);
      });
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener("keydown", this.keyboardHandler);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.resizeFrame) {
      cancelAnimationFrame(this.resizeFrame);
    }

    if (this.pendingConstraintFrame) {
      cancelAnimationFrame(this.pendingConstraintFrame);
    }

    this.unbindCanvasEvents();
    this.fabricCanvas?.dispose();
    this.fabricCanvas = undefined;
  }

  onImageLoaded(): void {
    this.syncCanvasSize();
  }

  clearDesign(): void {
    this.fabricCanvas?.clear();
    this.fabricCanvas?.renderAll();
    this.syncToolbarState();
  }

  getCurrentCanvasState(): string {
    if (!this.fabricCanvas) {
      return "";
    }

    this.saveCurrentViewState(this.viewAngle);

    return JSON.stringify({
      activeView: this.viewAngle,
      front: this.stateService.getState("front"),
      back: this.stateService.getState("back"),
    });
  }

  restoreDesignState(canvasStateJSON: string): void {
    if (!this.fabricCanvas) {
      return;
    }

    const parsedState = this.parseCanvasState(canvasStateJSON);

    if (!parsedState) {
      return;
    }

    const nextView = parsedState.activeView;
    const frontState = parsedState.front;
    const backState = parsedState.back;

    if (frontState) {
      this.stateService.saveState("front", frontState);
    } else {
      this.stateService.clearState("front");
    }

    if (backState) {
      this.stateService.saveState("back", backState);
    } else {
      this.stateService.clearState("back");
    }

    this.viewAngle = nextView;
    this.loadViewState(this.viewAngle);
    this.syncCanvasSize();
    this.schedulePrintableConstraint();
    this.syncToolbarState();
  }

  async exportCurrentDesignSnapshot(): Promise<string | null> {
    if (!this.fabricCanvas) {
      return null;
    }

    this.syncCanvasSize();

    const dataUrl = this.fabricCanvas.toDataURL({
      format: "png",
      multiplier: 2,
      quality: 1,
      enableRetinaScaling: true,
    });

    const file = this.dataUrlToFile(dataUrl, `design-${Date.now()}.png`);

    if (!file) {
      return null;
    }

    return firstValueFrom(this.productService.uploadDesignSnapshot(file));
  }

  /**
   * Captures a composite screenshot of the current live view:
   * the live product background image overlaid with the current Fabric canvas objects.
   * This is the canonical way to generate a SnapshotImageURL-ready base64 PNG.
   */
  async captureCompositeSnapshot(): Promise<string | null> {
    if (!this.fabricCanvas) {
      return null;
    }
    this.syncCanvasSize();
    const imageEl = this.previewImageRef?.nativeElement as
      | HTMLImageElement
      | undefined;
    return this.compositeWithBackground(imageEl?.src ?? "");
  }

  /**
   * Programmatically switch to targetView, fully render it, and return a
   * composite base64 PNG (product background + Fabric objects).
   *
   * The current view state is saved first. The caller is responsible for
   * restoring the original view via restoreViewSnapshot() when all captures are done.
   */
  async captureViewSnapshot(
    targetView: "front" | "back",
    bgImageUrl: string,
  ): Promise<string | null> {
    if (!this.fabricCanvas) {
      return null;
    }

    // Persist current editing state before switching
    this.saveCurrentViewState(this.viewAngle);

    // Switch internal view
    const state = this.stateService.getState(targetView);
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.clear();
    this.viewAngle = targetView;

    if (state) {
      try {
        await this.loadFromJSONAsync(state);
      } catch (err) {
        console.error(
          "[DesignCanvas] captureViewSnapshot – loadFromJSON failed",
          err,
        );
      }
    }

    this.syncCanvasSize();
    this.fabricCanvas.renderAll();

    return this.compositeWithBackground(bgImageUrl);
  }

  /**
   * Restore the canvas to the given view's saved state.
   * Call this after all captureViewSnapshot() calls to bring the editor
   * back to the side the user was editing.
   */
  async restoreViewSnapshot(view: "front" | "back"): Promise<void> {
    if (!this.fabricCanvas) {
      return;
    }

    const state = this.stateService.getState(view);
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.clear();
    this.viewAngle = view;

    if (state) {
      try {
        await this.loadFromJSONAsync(state);
      } catch (err) {
        console.error(
          "[DesignCanvas] restoreViewSnapshot – loadFromJSON failed",
          err,
        );
        this.fabricCanvas.clear();
      }
    }

    this.syncCanvasSize();
    this.fabricCanvas.renderAll();
    this.schedulePrintableConstraint();
    this.syncToolbarState();
  }

  /**
   * Generates an offscreen composite snapshot for a given canvas state + background URL.
   * Used to generate front/back preview images from stored Fabric JSON states.
   */
  async generateSnapshotForStateAndImage(
    canvasState: unknown,
    imageUrl: string,
  ): Promise<string | null> {
    if (!this.fabricCanvas) {
      return null;
    }

    const w = this.fabricCanvas.getWidth() || 800;
    const h = this.fabricCanvas.getHeight() || 800;

    try {
      // 1. Load background product image
      const bgImg = await this.loadImageAsync(imageUrl);

      // 2. Create offscreen composite canvas
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return null;

      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, w, h);
      }

      if (!canvasState) {
        return tempCanvas.toDataURL("image/png");
      }

      // 3. Create offscreen Fabric canvas
      const fCanvasEl = document.createElement("canvas");
      fCanvasEl.width = w;
      fCanvasEl.height = h;

      const fCanvas = new FabricCanvas(fCanvasEl, {
        backgroundColor: "transparent",
        enableRetinaScaling: false,
      });
      fCanvas.setDimensions({ width: w, height: h });

      // 4. Load JSON (Fabric v6 returns a Promise — await it properly)
      await this.loadFromJSONOnCanvas(fCanvas, canvasState);

      // 5. Render and composite
      fCanvas.renderAll();
      ctx.drawImage(fCanvasEl, 0, 0, w, h);
      fCanvas.dispose();

      return tempCanvas.toDataURL("image/png");
    } catch (error) {
      console.error(
        "[DesignCanvas] generateSnapshotForStateAndImage error:",
        error,
      );
      return null;
    }
  }

  saveCurrentViewState(viewAngle: "front" | "back" = this.viewAngle): void {
    if (!this.fabricCanvas) {
      return;
    }

    const snapshot = this.serializeCanvasState();
    const objectCount = this.fabricCanvas.getObjects().length;

    console.log(`[Fabric] saveCurrentViewState`, {
      targetSide: viewAngle,
      objectCountBeforeSave: objectCount,
      snapshot,
    });

    this.stateService.saveState(viewAngle, snapshot);
    console.log(`[Fabric] saved state for ${viewAngle}`, {
      storedState: this.stateService.getState(viewAngle),
    });
  }

  loadViewState(viewAngle: "front" | "back", stateOverride?: unknown): void {
    if (!this.fabricCanvas) {
      return;
    }

    const state = stateOverride ?? this.stateService.getState(viewAngle);
    const objectCountBeforeLoad = this.fabricCanvas.getObjects().length;

    console.log(`[Fabric] loadViewState start`, {
      targetSide: viewAngle,
      objectCountBeforeLoad,
      stateExists: Boolean(state),
      state,
    });

    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.clear();
    this.fabricCanvas.requestRenderAll();
    console.log(`[Fabric] canvas cleanup complete`, {
      targetSide: viewAngle,
      objectCountAfterClear: this.fabricCanvas.getObjects().length,
    });

    if (!state) {
      this.syncToolbarState();
      console.log(`[Fabric] no saved state for ${viewAngle}; canvas cleared`);
      return;
    }

    try {
      this.stateService.saveState(viewAngle, state);
      console.log(`[Fabric] calling loadFromJSON for ${viewAngle}`, {
        targetState: state,
      });
      // Fabric v6: loadFromJSON returns a Promise. Await it, then render.
      this.loadFromJSONAsync(state)
        .then(() => {
          this.fabricCanvas?.requestRenderAll();
          this.schedulePrintableConstraint();
          this.syncToolbarState();
          console.log(`[Fabric] loadFromJSON complete`, {
            targetSide: viewAngle,
            objectCountAfterLoad: this.fabricCanvas?.getObjects().length ?? 0,
          });
        })
        .catch((error: unknown) => {
          console.error(`[Fabric] loadFromJSON failed for ${viewAngle}`, error);
          this.fabricCanvas?.clear();
          this.fabricCanvas?.requestRenderAll();
        });
    } catch (error) {
      console.error(`[Fabric] Failed to restore state for ${viewAngle}`, error);
      this.fabricCanvas.clear();
      this.fabricCanvas.requestRenderAll();
    }
  }

  switchView(
    nextViewAngle: "front" | "back",
    previousViewAngle?: "front" | "back",
  ): void {
    if (!this.fabricCanvas) {
      return;
    }

    const currentView = previousViewAngle ?? this.viewAngle;

    console.log(`[Fabric] === SWITCH START ===`, {
      currentSide: currentView,
      nextSide: nextViewAngle,
      objectCountBeforeSwitch: this.fabricCanvas.getObjects().length,
    });

    this.saveCurrentViewState(currentView);
    this.viewAngle = nextViewAngle;
    console.log(`[Fabric] activeView updated`, {
      activeView: this.viewAngle,
    });

    requestAnimationFrame(() => {
      this.loadViewState(nextViewAngle);
      this.syncCanvasSize();
      console.log(`[Fabric] === SWITCH END ===`, {
        activeView: this.viewAngle,
        objectCountAfterSwitch: this.fabricCanvas?.getObjects().length ?? 0,
      });
    });
  }

  triggerImageUpload(): void {
    this.imageInputRef?.nativeElement?.click();
  }

  async handleImageSelection(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.fabricCanvas) {
      return;
    }

    try {
      this.syncCanvasSize();
      const imageLayer = await this.imageLayerService.createImageLayerFromFile(
        this.fabricCanvas,
        file,
      );

      if (imageLayer) {
        this.applyGraphicAssetMetadata(imageLayer);
        this.schedulePrintableConstraint();
        this.syncToolbarState();
      }
    } finally {
      input.value = "";
    }
  }

  async addGraphicAsset(
    imageUrl: string,
    graphicAssetId?: string,
  ): Promise<void> {
    if (!this.fabricCanvas || !imageUrl) {
      return;
    }

    this.syncCanvasSize();
    try {
      // Resolve the proxy path so the browser can load it cross-origin,
      // but keep the ORIGINAL relative server URL as the src stored in the
      // canvas JSON.  This prevents CreateDesignCommandHandler from treating
      // the image as a new base64 upload on every save and avoids the
      // duplicate-GraphicAsset-record problem.
      const proxyPath = this.resolveProxyPath(imageUrl);

      const { FabricImage } = await import("fabric");
      const fabricImg = await FabricImage.fromURL(proxyPath, {
        crossOrigin: "anonymous",
      });

      if (!fabricImg) {
        throw new Error("Failed to load image from URL.");
      }

      // Scale to fit inside the 240×240 "comfortable" box.
      const naturalW = fabricImg.width ?? 240;
      const naturalH = fabricImg.height ?? 240;
      const ratio = Math.min(240 / naturalW, 240 / naturalH, 1);
      fabricImg.scaleToWidth(naturalW * ratio);
      fabricImg.scaleToHeight(naturalH * ratio);

      const center = this.fabricCanvas.getVpCenter();
      fabricImg.set({
        left: center.x,
        top: center.y,
        originX: "center",
        originY: "center",
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        cornerStyle: "circle",
        cornerSize: 8,
        transparentCorners: false,
        borderColor: "#5b8def",
        cornerColor: "#ffffff",
      });

      // Override the serialised src back to the canonical server-relative URL
      // so the canvas JSON always stores the stable path (not the proxy path).
      const canonicalSrc = this.canonicalUrl(imageUrl);
      (fabricImg as any).src = canonicalSrc;
      (fabricImg as any)._originalElement = fabricImg.getElement();

      this.fabricCanvas.add(fabricImg);
      this.fabricCanvas.setActiveObject(fabricImg);
      this.fabricCanvas.requestRenderAll();

      this.applyGraphicAssetMetadata(fabricImg as unknown as FabricObject, {
        graphicAssetId,
        placement: "foreground",
      });
      this.schedulePrintableConstraint();
      this.syncToolbarState();
    } catch (err: any) {
      console.error(
        "[DesignCanvas] Failed to add graphic asset to canvas.",
        err,
      );
      this.toastService.error(
        `Failed to add image: ${err?.message || err || "Unknown error"}`,
      );
    }
  }

  /**
   * Maps a server-relative /GraphicAssets/... URL to the local dev-proxy path
   * so the browser can fetch it without CORS issues.
   */
  private resolveProxyPath(imageUrl: string): string {
    try {
      const path = new URL(imageUrl).pathname;
      return path.replace(
        /^\/GraphicAssets\//,
        "/api/DesignStudio/graphic-asset-file/",
      );
    } catch {
      // Relative URL — try a simple string replace.
      return imageUrl.replace(
        /^\/GraphicAssets\//,
        "/api/DesignStudio/graphic-asset-file/",
      );
    }
  }

  /**
   * Returns the canonical server-relative URL that should be stored in the
   * canvas JSON src field.  If the URL is already relative (starts with /),
   * it is returned as-is; otherwise only the pathname is kept.
   */
  private canonicalUrl(imageUrl: string): string {
    try {
      return new URL(imageUrl).pathname;
    } catch {
      return imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    }
  }

  private async fetchAsFile(imageUrl: string): Promise<File> {
    // Map /GraphicAssets/{userId}/{fileName} to /api/DesignStudio/graphic-asset-file/{userId}/{fileName}
    // so that the request automatically routes through the active /api dev proxy context.
    const proxyPath = (() => {
      try {
        const path = new URL(imageUrl).pathname;
        return path.replace(
          /^\/GraphicAssets\//,
          "/api/DesignStudio/graphic-asset-file/",
        );
      } catch {
        return imageUrl.replace(
          /^\/GraphicAssets\//,
          "/api/DesignStudio/graphic-asset-file/",
        );
      }
    })();

    const response = await fetch(proxyPath);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }
    const blob = await response.blob();
    const filename = proxyPath.split("/").pop() ?? "graphic-asset";
    return new File([blob], filename, { type: blob.type });
  }

  addText(): void {
    if (!this.fabricCanvas) {
      return;
    }

    this.syncCanvasSize();
    const textLayer = this.textLayerService.createTextLayer(this.fabricCanvas);
    this.schedulePrintableConstraint();
    this.syncToolbarState();
    this.textLayerService.startEditingText(this.fabricCanvas, textLayer);
  }

  editSelectedText(): void {
    if (!this.fabricCanvas) {
      return;
    }

    this.textLayerService.startEditingText(this.fabricCanvas);
  }

  deleteSelectedObject(): void {
    if (!this.fabricCanvas) {
      return;
    }

    this.textLayerService.deleteSelectedObject(this.fabricCanvas);
    this.syncToolbarState();
  }

  updateTextValue(value: string): void {
    this.selectedTextValue = value;

    if (!this.fabricCanvas) {
      return;
    }

    this.textLayerService.updateSelectedText(this.fabricCanvas, {
      text: value,
    } as Partial<Textbox>);
    this.syncToolbarState();
  }

  updateFontSize(value: string): void {
    const nextSize = Number.parseInt(value, 10);
    this.fontSize = Number.isNaN(nextSize) ? 28 : nextSize;

    if (!this.fabricCanvas) {
      return;
    }

    this.textLayerService.updateSelectedTextStyle(this.fabricCanvas, {
      fontSize: this.fontSize,
    });
  }

  updateFontFamily(value: string): void {
    this.fontFamily = value;

    if (!this.fabricCanvas) {
      return;
    }

    this.textLayerService.updateSelectedTextStyle(this.fabricCanvas, {
      fontFamily: this.fontFamily,
    });
  }

  updateTextColor(value: string): void {
    this.textColor = value;

    if (!this.fabricCanvas) {
      return;
    }

    this.textLayerService.updateSelectedTextStyle(this.fabricCanvas, {
      fill: this.textColor,
    });
  }

  private initializeCanvas(): void {
    if (!this.fabricCanvasRef?.nativeElement) {
      console.log(`[Fabric] initializeCanvas skipped; canvas element missing`);
      return;
    }

    console.log(`[Fabric] initializeCanvas start`, {
      initialView: this.viewAngle,
    });

    this.fabricCanvas = new FabricCanvas(this.fabricCanvasRef.nativeElement, {
      backgroundColor: "transparent",
      preserveObjectStacking: true,
      selection: true,
      stopContextMenu: true,
      fireRightClick: false,
      enableRetinaScaling: true,
      perPixelTargetFind: true,
      interactive: true,
    });

    this.fabricCanvas.hoverCursor = "move";
    this.fabricCanvas.setDimensions({ width: 0, height: 0 });
    this.loadViewState(this.viewAngle);
  }

  private bindCanvasEvents(): void {
    if (!this.fabricCanvas) {
      return;
    }

    this.fabricCanvas.on("selection:created", () => {
      this.syncToolbarState();
    });

    this.fabricCanvas.on("selection:updated", () => {
      this.syncToolbarState();
    });

    this.fabricCanvas.on("selection:cleared", () => {
      this.syncToolbarState();
    });

    this.fabricCanvas.on("object:modified", () => {
      this.syncToolbarState();
      this.schedulePrintableConstraint();
    });

    this.fabricCanvas.on("object:moving", (event: any) => {
      const target = event.target;
      if (!target) {
        return;
      }
      this.constraintService.constrainObject(
        this.fabricCanvas,
        target,
        this.printableZone,
      );
    });

    this.fabricCanvas.on("object:scaling", (event: any) => {
      const target = event.target;
      if (!target) {
        return;
      }
      this.constraintService.constrainObject(
        this.fabricCanvas,
        target,
        this.printableZone,
      );
    });

    this.fabricCanvas.on("object:rotating", (event: any) => {
      const target = event.target;
      if (!target) {
        return;
      }
      this.constraintService.constrainObject(
        this.fabricCanvas,
        target,
        this.printableZone,
      );
    });
  }

  private unbindCanvasEvents(): void {
    if (!this.fabricCanvas) {
      return;
    }

    this.fabricCanvas.off("selection:created");
    this.fabricCanvas.off("selection:updated");
    this.fabricCanvas.off("selection:cleared");
    this.fabricCanvas.off("object:modified");
    this.fabricCanvas.off("object:moving");
    this.fabricCanvas.off("object:scaling");
    this.fabricCanvas.off("object:rotating");
  }

  private setupResizeObserver(): void {
    const imageElement = this.previewImageRef?.nativeElement;

    if (!imageElement || typeof ResizeObserver === "undefined") {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.scheduleCanvasSync());
    this.resizeObserver.observe(imageElement);
  }

  private scheduleCanvasSync(): void {
    if (this.resizeFrame) {
      cancelAnimationFrame(this.resizeFrame);
    }

    this.resizeFrame = requestAnimationFrame(() => this.syncCanvasSize());
  }

  private syncCanvasSize(): void {
    const imageElement = this.previewImageRef?.nativeElement;
    const canvasElement = this.fabricCanvasRef?.nativeElement;
    const canvasHostElement = this.canvasHostRef?.nativeElement;

    if (
      !imageElement ||
      !canvasElement ||
      !canvasHostElement ||
      !this.fabricCanvas
    ) {
      return;
    }

    const width = Math.max(1, Math.round(imageElement.clientWidth || 0));
    const height = Math.max(1, Math.round(imageElement.clientHeight || 0));

    if (!width || !height) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    canvasElement.width = Math.floor(width * ratio);
    canvasElement.height = Math.floor(height * ratio);
    canvasElement.style.width = `${width}px`;
    canvasElement.style.height = `${height}px`;
    canvasHostElement.style.width = `${width}px`;
    canvasHostElement.style.height = `${height}px`;

    this.fabricCanvas.setDimensions({ width, height });
    this.fabricCanvas.calcOffset();
    this.fabricCanvas.renderAll();
    this.schedulePrintableConstraint();
  }

  private serializeCanvasState(): unknown {
    if (!this.fabricCanvas) {
      return null;
    }

    const snapshot = (this.fabricCanvas as any).toJSON(["graphicAssetId", "data"]);
    const objects = Array.isArray(snapshot?.objects) ? snapshot.objects : [];

    return {
      ...snapshot,
      objects: objects.map((objectState: Record<string, unknown>) =>
        this.serializeFabricObjectState(objectState),
      ),
    };
  }

  private serializeFabricObjectState(
    objectState: Record<string, unknown>,
  ): Record<string, unknown> {
    const existingData = (objectState["data"] ?? {}) as Record<string, unknown>;
    const graphicAssetId =
      (existingData["graphicAssetId"] as string | null | undefined) ??
      (objectState["graphicAssetId"] as string | null | undefined) ??
      null;
    const position = this.resolveObjectPosition(objectState, existingData);
    const rotation = this.resolveObjectRotation(objectState, existingData);
    const placement = this.resolveObjectPlacement(existingData);

    return {
      ...objectState,
      graphicAssetId,
      data: {
        ...existingData,
        graphicAssetId,
        position,
        rotation,
        placement,
      },
    };
  }

  private resolveObjectPosition(
    objectState: Record<string, unknown>,
    existingData: Record<string, unknown>,
  ): { left: number; top: number } {
    const existingPosition = existingData["position"] as
      | { left?: number; top?: number }
      | undefined;

    return {
      left: Number(existingPosition?.left ?? objectState["left"] ?? 0),
      top: Number(existingPosition?.top ?? objectState["top"] ?? 0),
    };
  }

  private resolveObjectRotation(
    objectState: Record<string, unknown>,
    existingData: Record<string, unknown>,
  ): number {
    const existingRotation = existingData["rotation"] as number | undefined;
    return Number(existingRotation ?? objectState["angle"] ?? 0);
  }

  private resolveObjectPlacement(
    existingData: Record<string, unknown>,
  ): "foreground" | "background" {
    return existingData["placement"] === "background"
      ? "background"
      : "foreground";
  }

  private applyGraphicAssetMetadata(
    object: FabricObject,
    metadata?: {
      graphicAssetId?: string | null;
      placement?: "foreground" | "background";
      position?: { left: number; top: number };
      rotation?: number;
    },
    targetCanvas?: FabricCanvas,
    serializedObj?: Record<string, unknown>,
  ): void {
    const existingData = (object.get("data") ?? serializedObj?.["data"] ?? {}) as Record<string, unknown>;
    const placement =
      metadata?.placement ?? this.resolveObjectPlacement(existingData);
    const position =
      metadata?.position ??
      this.resolveObjectPosition(
        {
          left: object.left ?? 0,
          top: object.top ?? 0,
        } as Record<string, unknown>,
        existingData,
      );
    const rotation =
      metadata?.rotation ??
      this.resolveObjectRotation(
        {
          angle: object.angle ?? 0,
        } as Record<string, unknown>,
        existingData,
      );
    const graphicAssetId =
      metadata?.graphicAssetId ??
      (existingData["graphicAssetId"] as string | null | undefined) ??
      (serializedObj?.["graphicAssetId"] as string | null | undefined) ??
      (object.get("graphicAssetId" as any) as string | null | undefined) ??
      null;

    const nextData = {
      ...existingData,
      graphicAssetId,
      position,
      rotation,
      placement,
    };

    object.set("data", nextData);
    object.set("graphicAssetId", graphicAssetId);
    object.set("graphicAssetPlacement", placement);
    object.set("graphicAssetPosition", position);
    object.set("graphicAssetRotation", rotation);

    const canvas = targetCanvas ?? this.fabricCanvas;
    if (canvas) {
      const canvasWithStacking = canvas as FabricCanvas & {
        sendToBack?: (obj: FabricObject) => void;
        bringToFront?: (obj: FabricObject) => void;
      };

      if (placement === "background") {
        canvasWithStacking.sendToBack?.(object);
      } else {
        canvasWithStacking.bringToFront?.(object);
      }
    }
  }

  private parseCanvasState(canvasStateJSON: string): {
    activeView: "front" | "back";
    front: unknown;
    back: unknown;
  } | null {
    try {
      const parsed = JSON.parse(canvasStateJSON) as Record<string, unknown>;

      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      if (parsed["front"] !== undefined || parsed["back"] !== undefined) {
        return {
          activeView: parsed["activeView"] === "back" ? "back" : "front",
          front: parsed["front"],
          back: parsed["back"],
        };
      }

      return {
        activeView: "front",
        front: parsed,
        back: null,
      };
    } catch {
      return null;
    }
  }

  private dataUrlToFile(dataUrl: string, filename: string): File | null {
    const [header, payload] = dataUrl.split(",");

    if (!header || !payload) {
      return null;
    }

    const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/png";
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new File([bytes], filename, { type: mime });
  }

  private schedulePrintableConstraint(): void {
    if (this.pendingConstraintFrame) {
      cancelAnimationFrame(this.pendingConstraintFrame);
    }

    this.pendingConstraintFrame = requestAnimationFrame(() => {
      this.constraintService.constrainAllObjects(
        this.fabricCanvas,
        this.printableZone,
      );
      this.pendingConstraintFrame = 0;
    });
  }

  /**
   * Fabric v6 async loadFromJSON wrapper.
   * Awaits the Promise returned by loadFromJSON, then waits for all
   * FabricImage elements inside the canvas to finish loading their sources.
   */
  private async loadFromJSONAsync(state: unknown): Promise<void> {
    if (!this.fabricCanvas) return;

    // Fabric v6: loadFromJSON(json, reviver?) returns Promise<Canvas>
    await (this.fabricCanvas.loadFromJSON(
      state as any,
      (_serializedObj: unknown, instance: unknown) => {
        if (instance) {
          this.applyGraphicAssetMetadata(
            instance as FabricObject,
            undefined,
            undefined,
            _serializedObj as Record<string, unknown>,
          );
        }
      },
    ) as unknown as Promise<unknown>);

    // Wait for any embedded FabricImage src URLs to finish loading
    const imageObjects = this.fabricCanvas
      .getObjects()
      .filter((o: any) => o.type === "image");
    await Promise.all(
      imageObjects.map((obj: any) => {
        const el: HTMLImageElement | null = obj._element ?? null;
        if (!el || (el.complete && el.naturalWidth > 0))
          return Promise.resolve();
        return new Promise<void>((resolve) => {
          el.onload = () => resolve();
          el.onerror = () => resolve();
        });
      }),
    );
  }

  /**
   * Same as loadFromJSONAsync but operates on a caller-provided FabricCanvas
   * (used for offscreen snapshot generation).
   */
  private async loadFromJSONOnCanvas(
    fCanvas: FabricCanvas,
    state: unknown,
  ): Promise<void> {
    await (fCanvas.loadFromJSON(
      state as any,
      (_serializedObj: unknown, instance: unknown) => {
        if (instance) {
          this.applyGraphicAssetMetadata(
            instance as FabricObject,
            undefined,
            fCanvas,
            _serializedObj as Record<string, unknown>,
          );
        }
      },
    ) as unknown as Promise<unknown>);

    const imageObjects = fCanvas
      .getObjects()
      .filter((o: any) => o.type === "image");
    await Promise.all(
      imageObjects.map((obj: any) => {
        const el: HTMLImageElement | null = obj._element ?? null;
        if (!el || (el.complete && el.naturalWidth > 0))
          return Promise.resolve();
        return new Promise<void>((resolve) => {
          el.onload = () => resolve();
          el.onerror = () => resolve();
        });
      }),
    );
  }

  /**
   * Composites the current Fabric canvas on top of a background image URL
   * and returns a base64 PNG data URL.
   */
  private async compositeWithBackground(
    bgImageUrl: string,
  ): Promise<string | null> {
    if (!this.fabricCanvas) return null;

    const width = this.fabricCanvas.getWidth() || 800;
    const height = this.fabricCanvas.getHeight() || 800;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return null;

    // 1. Draw product background image
    if (bgImageUrl) {
      const bg = await this.loadImageAsync(bgImageUrl);
      if (bg) {
        try {
          ctx.drawImage(bg, 0, 0, width, height);
        } catch {
          /* tainted */
        }
      }
    }

    // 2. Overlay live Fabric canvas
    this.fabricCanvas.renderAll();
    const fabricEl = this.fabricCanvasRef?.nativeElement;
    if (fabricEl) {
      try {
        ctx.drawImage(fabricEl, 0, 0, width, height);
      } catch {
        /* tainted */
      }
    }

    return tempCanvas.toDataURL("image/png");
  }

  /**
   * Loads an image from a URL and returns the HTMLImageElement,
   * or null if the URL is empty or the load fails.
   */
  private loadImageAsync(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  private syncToolbarState(): void {
    const activeObject = this.fabricCanvas?.getActiveObject();

    if (!activeObject) {
      this.hasSelection = false;
      return;
    }

    this.hasSelection = true;

    if (activeObject instanceof Textbox) {
      this.selectedTextValue = activeObject.text?.toString() ?? "";
      this.fontSize = activeObject.fontSize ?? 28;
      this.fontFamily = activeObject.fontFamily ?? "Inter, sans-serif";
      this.textColor =
        typeof activeObject.fill === "string" ? activeObject.fill : "#ffffff";
      return;
    }

    this.selectedTextValue = "";
    this.fontSize = 28;
    this.fontFamily = "Inter, sans-serif";
    this.textColor = "#ffffff";
  }

  private handleKeyboardShortcut(event: KeyboardEvent): void {
    const key = event.key;

    if (key !== "Delete" && key !== "Backspace") {
      return;
    }

    const activeObject = this.fabricCanvas?.getActiveObject();

    if (!activeObject) {
      return;
    }

    event.preventDefault();
    this.deleteSelectedObject();
  }
}