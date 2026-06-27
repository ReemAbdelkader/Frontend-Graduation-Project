import { Injectable } from "@angular/core";
import { Canvas as FabricCanvas, FabricObject, Point } from "fabric";

export interface PrintableZoneBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

@Injectable({ providedIn: "root" })
export class FabricPrintableZoneConstraintService {
  constrainObject(
    canvas: FabricCanvas | undefined,
    object: FabricObject | undefined,
    zone: PrintableZoneBounds | null | undefined,
  ): void {
    if (!canvas || !object || !zone) {
      return;
    }

    const normalizedZone = this.normalizeZone(zone);

    if (!normalizedZone) {
      return;
    }

    const rect = object.getBoundingRect();

    if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top)) {
      return;
    }

    const zoneRight = normalizedZone.left + normalizedZone.width;
    const zoneBottom = normalizedZone.top + normalizedZone.height;

    const widthScale = normalizedZone.width / Math.max(rect.width || 1, 1);
    const heightScale = normalizedZone.height / Math.max(rect.height || 1, 1);
    const fitFactor = Math.min(widthScale, heightScale, 1);

    if (fitFactor < 1) {
      const nextScaleX = (object.scaleX ?? 1) * fitFactor;
      const nextScaleY = (object.scaleY ?? 1) * fitFactor;

      object.scaleX = nextScaleX;
      object.scaleY = nextScaleY;
    }

    const adjustedRect = object.getBoundingRect();
    let deltaX = 0;
    let deltaY = 0;

    if (adjustedRect.left < normalizedZone.left) {
      deltaX = normalizedZone.left - adjustedRect.left;
    } else if (adjustedRect.left + adjustedRect.width > zoneRight) {
      deltaX = zoneRight - (adjustedRect.left + adjustedRect.width);
    }

    if (adjustedRect.top < normalizedZone.top) {
      deltaY = normalizedZone.top - adjustedRect.top;
    } else if (adjustedRect.top + adjustedRect.height > zoneBottom) {
      deltaY = zoneBottom - (adjustedRect.top + adjustedRect.height);
    }

    if (deltaX !== 0 || deltaY !== 0) {
      const centerPoint = object.getCenterPoint();
      object.setPositionByOrigin(
        new Point(centerPoint.x + deltaX, centerPoint.y + deltaY),
        "center",
        "center",
      );
    }

    object.setCoords();
    canvas.requestRenderAll();
  }

  constrainAllObjects(
    canvas: FabricCanvas | undefined,
    zone: PrintableZoneBounds | null | undefined,
  ): void {
    if (!canvas) {
      return;
    }

    canvas.getObjects().forEach((object: any) => {
      this.constrainObject(canvas, object, zone);
    });
  }

  normalizeZone(
    zone: PrintableZoneBounds | null | undefined,
  ): PrintableZoneBounds | null {
    if (!zone) {
      return null;
    }

    const width = Math.max(1, Number(zone.width) || 1);
    const height = Math.max(1, Number(zone.height) || 1);

    return {
      left: Number(zone.left) || 0,
      top: Number(zone.top) || 0,
      width,
      height,
    };
  }
}
