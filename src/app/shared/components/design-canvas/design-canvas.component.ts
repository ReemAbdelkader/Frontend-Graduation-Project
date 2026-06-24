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

  private fabricCanvas?: FabricCanvas;
  private resizeObserver?: ResizeObserver;
  private resizeFrame = 0;

  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.setupResizeObserver();
    this.syncCanvasSize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["imageUrl"] && !changes["imageUrl"].firstChange) {
      this.syncCanvasSize();
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.resizeFrame) {
      cancelAnimationFrame(this.resizeFrame);
    }

    this.fabricCanvas?.dispose();
    this.fabricCanvas = undefined;
  }

  onImageLoaded(): void {
    this.syncCanvasSize();
  }

  clearDesign(): void {
    this.fabricCanvas?.clear();
    this.fabricCanvas?.renderAll();
  }

  addText(text: string): void {
    if (!this.fabricCanvas) {
      return;
    }

    const textbox = new Textbox(text, {
      left: 40,
      top: 40,
      fontSize: 28,
      fill: "#ffffff",
      fontFamily: "Inter, sans-serif",
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      padding: 8,
      cornerStyle: "circle",
      cornerSize: 8,
      transparentCorners: false,
    });

    this.fabricCanvas.add(textbox);
    this.fabricCanvas.setActiveObject(textbox);
    this.fabricCanvas.renderAll();
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
    });

    this.fabricCanvas.setDimensions({ width: 0, height: 0 });
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

    if (!imageElement || !canvasElement || !this.fabricCanvas) {
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

    this.fabricCanvas.setDimensions({ width, height });
    this.fabricCanvas.renderAll();
  }
}
