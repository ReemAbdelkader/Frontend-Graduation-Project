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
import { Canvas as FabricCanvas, Textbox } from "fabric";
<<<<<<< HEAD
import { firstValueFrom } from "rxjs";
import { ProductService } from "../../../core/services/product.service";
=======
>>>>>>> 206a691 (Add my updates)
import { FabricDesignStateService } from "./services/fabric-design-state.service";
import { FabricImageLayerService } from "./services/fabric-image-layer.service";
import { FabricTextLayerService } from "./services/fabric-text-layer.service";

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
  private readonly keyboardHandler = (event: KeyboardEvent) => {
    this.handleKeyboardShortcut(event);
  };

  constructor(
    private readonly textLayerService: FabricTextLayerService,
    private readonly imageLayerService: FabricImageLayerService,
    private readonly stateService: FabricDesignStateService,
<<<<<<< HEAD
    private readonly productService: ProductService,
=======
>>>>>>> 206a691 (Add my updates)
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

<<<<<<< HEAD
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

=======
>>>>>>> 206a691 (Add my updates)
  saveCurrentViewState(viewAngle: "front" | "back" = this.viewAngle): void {
    if (!this.fabricCanvas) {
      return;
    }

    const snapshot = this.fabricCanvas.toJSON();
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

<<<<<<< HEAD
  loadViewState(viewAngle: "front" | "back", stateOverride?: unknown): void {
=======
  loadViewState(viewAngle: "front" | "back"): void {
>>>>>>> 206a691 (Add my updates)
    if (!this.fabricCanvas) {
      return;
    }

<<<<<<< HEAD
    const state = stateOverride ?? this.stateService.getState(viewAngle);
=======
    const state = this.stateService.getState(viewAngle);
>>>>>>> 206a691 (Add my updates)
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
<<<<<<< HEAD
      this.stateService.saveState(viewAngle, state);
=======
>>>>>>> 206a691 (Add my updates)
      console.log(`[Fabric] calling loadFromJSON for ${viewAngle}`, {
        targetState: state,
      });
      this.fabricCanvas.loadFromJSON(state as any, () => {
        this.fabricCanvas?.requestRenderAll();
        this.syncToolbarState();
        console.log(`[Fabric] loadFromJSON callback complete`, {
          targetSide: viewAngle,
          objectCountAfterLoad: this.fabricCanvas?.getObjects().length ?? 0,
        });
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
        this.syncToolbarState();
      }
    } finally {
      input.value = "";
    }
  }

  addText(): void {
    if (!this.fabricCanvas) {
      return;
    }

    this.syncCanvasSize();
    const textLayer = this.textLayerService.createTextLayer(this.fabricCanvas);
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
  }

<<<<<<< HEAD
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

=======
>>>>>>> 206a691 (Add my updates)
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
