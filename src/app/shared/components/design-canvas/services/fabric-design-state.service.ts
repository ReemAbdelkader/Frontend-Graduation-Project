import { Injectable } from "@angular/core";

export type FabricDesignView = "front" | "back";

@Injectable({ providedIn: "root" })
export class FabricDesignStateService {
  private readonly designStates = new Map<FabricDesignView, unknown>();

  saveState(view: FabricDesignView, snapshot: unknown): void {
    this.designStates.set(view, snapshot);
  }

  getState(view: FabricDesignView): unknown | null {
    return this.designStates.get(view) ?? null;
  }

  clearState(view: FabricDesignView): void {
    this.designStates.delete(view);
  }

  hasState(view: FabricDesignView): boolean {
    return this.designStates.has(view);
  }
}
