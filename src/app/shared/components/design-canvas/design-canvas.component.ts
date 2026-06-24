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
      this.syncCanvasSize();
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
      return;
    }

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
