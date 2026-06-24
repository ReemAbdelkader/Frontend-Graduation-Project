import { Injectable } from "@angular/core";
import { Canvas as FabricCanvas, Textbox } from "fabric";

export interface FabricTextStyleState {
  fontSize: number;
  fontFamily: string;
  fill: string;
}

export interface FabricTextLayerOptions {
  left?: number;
  top?: number;
  fontSize?: number;
  fill?: string;
  fontFamily?: string;
}

@Injectable({ providedIn: "root" })
export class FabricTextLayerService {
  createTextLayer(
    canvas: FabricCanvas,
    options: FabricTextLayerOptions = {},
  ): Textbox {
    const center = canvas.getVpCenter();
    const textbox = new Textbox("Double click to edit", {
      left: options.left ?? center.x,
      top: options.top ?? center.y,
      fontSize: 28,
      fill: "#ffffff",
      fontFamily: "Inter, sans-serif",
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      padding: 10,
      editable: true,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockScalingFlip: false,
      transparentCorners: false,
      cornerStyle: "circle",
      cornerSize: 8,
      borderColor: "#5b8def",
      cornerColor: "#ffffff",
      originX: "center",
      originY: "center",
      ...options,
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();

    return textbox;
  }

  getSelectedText(canvas: FabricCanvas): Textbox | null {
    const activeObject = canvas.getActiveObject();
    return activeObject instanceof Textbox ? activeObject : null;
  }

  selectTextLayer(canvas: FabricCanvas, textLayer: Textbox): void {
    canvas.setActiveObject(textLayer);
    canvas.requestRenderAll();
  }

  startEditingText(canvas: FabricCanvas, textLayer?: Textbox): void {
    const layer = textLayer ?? this.getSelectedText(canvas);

    if (!layer) {
      return;
    }

    this.selectTextLayer(canvas, layer);
    layer.enterEditing();
    layer.selectAll();
    canvas.requestRenderAll();
  }

  updateSelectedText(canvas: FabricCanvas, updates: Partial<Textbox>): void {
    const selectedText = this.getSelectedText(canvas);

    if (!selectedText) {
      return;
    }

    selectedText.set(updates);
    canvas.requestRenderAll();
  }

  updateSelectedTextStyle(
    canvas: FabricCanvas,
    style: Partial<FabricTextStyleState>,
  ): void {
    const selectedText = this.getSelectedText(canvas);

    if (!selectedText) {
      return;
    }

    selectedText.set({
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fill: style.fill,
    });

    canvas.requestRenderAll();
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
}
