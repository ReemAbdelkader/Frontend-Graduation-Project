import { Injectable } from "@angular/core";
import { Canvas as FabricCanvas, FabricImage } from "fabric";

export interface FabricImageLayerOptions {
  maxWidth?: number;
  maxHeight?: number;
  left?: number;
  top?: number;
  opacity?: number;
}

@Injectable({ providedIn: "root" })
export class FabricImageLayerService {
  async createImageLayer(
    canvas: FabricCanvas,
    imageDataUrl: string,
    options: FabricImageLayerOptions = {},
  ): Promise<FabricImage | null> {
    const img = await this.loadImageElement(imageDataUrl);

    if (!img) {
      return null;
    }

    const scaled = this.scaleToFit(
      img,
      options.maxWidth ?? 240,
      options.maxHeight ?? 240,
    );
    const center = canvas.getVpCenter();
    const fabricImage = new FabricImage(img, {
      left: options.left ?? center.x,
      top: options.top ?? center.y,
      opacity: options.opacity ?? 1,
      originX: "center",
      originY: "center",
      angle: 0,
      crossOrigin: "anonymous",
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

    fabricImage.scaleToWidth(scaled.width);
    fabricImage.scaleToHeight(scaled.height);

    canvas.add(fabricImage);
    canvas.setActiveObject(fabricImage);
    canvas.requestRenderAll();

    return fabricImage;
  }

  async createImageLayerFromFile(
    canvas: FabricCanvas,
    file: File,
    options: FabricImageLayerOptions = {},
  ): Promise<FabricImage | null> {
    const dataUrl = await this.readFileAsDataUrl(file);
    return this.createImageLayer(canvas, dataUrl, options);
  }

  deleteSelectedObject(canvas: FabricCanvas): void {
    const activeObject = canvas.getActiveObject();

    if (!activeObject) {
      return;
    }

    canvas.remove(activeObject);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });
  }

  private loadImageElement(dataUrl: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  private scaleToFit(
    img: HTMLImageElement,
    maxWidth: number,
    maxHeight: number,
  ): { width: number; height: number } {
    const ratio = Math.min(
      maxWidth / img.naturalWidth,
      maxHeight / img.naturalHeight,
      1,
    );
    return {
      width: img.naturalWidth * ratio,
      height: img.naturalHeight * ratio,
    };
  }
}
