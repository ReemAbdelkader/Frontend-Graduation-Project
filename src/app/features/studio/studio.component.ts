import { Component, inject, signal, computed, ViewChild } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { forkJoin, catchError, of } from "rxjs";
import { CheckoutPayModalComponent } from "../../shared/components/checkout-pay-modal/checkout-pay-modal.component";
import { DesignCanvasComponent } from "../../shared/components/design-canvas/design-canvas.component";
import { ConfirmDialogComponent } from "../../shared/components/confirm-dialog/confirm-dialog.component";
import { ProductService } from "../../core/services/product.service";
import { AuthService } from "../../core/services/auth.service";
import { AiImageService, GraphicAssetDto } from "../../core/services/ai-image.service";
import { ToastService } from "../../core/services/toast.service";
import { resolveApiUrl } from "../../core/services/api-config";
import {
  CategoryDto,
  PrintableZoneBounds,
  ProductDto,
  ProductImageDto,
} from "../../core/models/shop.models";
import { environment } from "../../../environments/environment";

interface ChatMsg {
  role: "ai" | "user";
  text: string;
  graphicAssetId?: string;
  imageUrl?: string;
}

interface CategoryWithCount extends CategoryDto {
  count: number;
}

type StudioTab = "products" | "custom" | "ai";

enum ViewAngle {
  Front = 1,
  Back = 2,
}

type StudioProduct = ProductDto & {
  image: string;
  images: ProductImageDto[];
  colors: string[];
  category: string;
  price: number;
};

import { CartService } from "../../core/services/cart.service";

@Component({
  selector: "app-studio",
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    CheckoutPayModalComponent,
    DesignCanvasComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: "./studio.component.html",
  styleUrl: "./studio.component.scss",
})
export class StudioComponent {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly aiImageService = inject(AiImageService);
  private readonly router = inject(Router);
  readonly toastService = inject(ToastService);
  private readonly lastDraftStorageKey = "atelier-last-design-id";

  readonly aiLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isAddingToCart = signal(false);
  readonly saveSuccessOpen = signal(false);
  readonly saveSuccessPreviewUrl = signal("");
  readonly cartSuccessOpen = signal(false);
  /** Tracks the designId of the currently saved design so Add to Cart can skip re-saving. */
  readonly currentDesignId = signal<string | null>(null);

  @ViewChild(DesignCanvasComponent)
  private readonly designCanvas?: DesignCanvasComponent;

  readonly logo = "assets/wearly-logo.png";
  readonly baseApiUrl = environment.apiUrl;
  readonly ViewAngle = ViewAngle;
  readonly categories = signal<CategoryDto[]>([]);
  readonly allProducts = signal<StudioProduct[]>([]);
  readonly productLoading = signal(true);
  readonly categoryLoading = signal(true);
  readonly loadError = signal(false);
  readonly selectedCategory = signal<string>("All");

  readonly tab = signal<StudioTab>("products");
  readonly tabOptions: StudioTab[] = ["products", "custom", "ai"];

  // Graphics tab state
  readonly userAssets = signal<GraphicAssetDto[]>([]);
  readonly adminAssets = signal<GraphicAssetDto[]>([]);
  readonly assetsLoading = signal(false);
  readonly graphicsSubTab = signal<'mine' | 'gallery'>('mine');
  private assetsLoaded = false;
  readonly selected = signal<StudioProduct>(this.createDefaultProduct());
  activeViewAngle: ViewAngle = ViewAngle.Front;

  get selectedProduct(): StudioProduct {
    return this.selected();
  }
  readonly color = signal<string>("#1A1A2E");
  readonly size = signal<string>("L");
  readonly selectedFabric = signal<number | null>(null);
  readonly selectedPrintMethod = signal<number | null>(null);

  /** Fabric options mapped to backend FabricType enum values */
  readonly fabricOptions: { label: string; value: number }[] = [
    { label: 'Cotton', value: 1 },
    { label: 'Polyester', value: 2 },
    { label: 'Wool', value: 4 },
    { label: 'Silk', value: 8 },
    { label: 'Linen', value: 16 },
  ];

  /** Print method options mapped to backend PrintMethodType enum values */
  readonly printMethodOptions: { label: string; value: number }[] = [
    { label: 'Direct to Garment', value: 1 },
    { label: 'Screen Printing', value: 2 },
    { label: 'Heat Transfer', value: 4 },
    { label: 'Sublimation', value: 8 },
    { label: 'Embroidery', value: 16 },
  ];
  readonly canvasOpen = signal(false);
  readonly payOpen = signal(false);

  readonly chatInput = signal("");
  readonly messages = signal<ChatMsg[]>([
    {
      role: "ai",
      text: "Hi Elena — I'm Atelier, your design co-pilot. Tell me a mood, palette, or garment and I'll render it on the mannequin.",
    },
    {
      role: "user",
      text: "I want a heavyweight hoodie with prism color blocks — violet, coral, mint.",
    },
    {
      role: "ai",
      text: "Love it. I'll layer the prism on the chest in 400gsm French terry. Want the back panel left clean, or a tonal 'W' monogram?",
    },
    {
      role: "user",
      text: "Clean back, but add a small embroidered W on the left sleeve.",
    },
    {
      role: "ai",
      text: "Locked in. Generating 4 variations now — coral-forward, mint-forward, violet-forward, and a balanced tri-tone. Ready in ~12s.",
    },
  ]);

  readonly categoryCounts = computed<CategoryWithCount[]>(() => {
    const products = this.allProducts();
    return this.categories().map((category) => ({
      ...category,
      count: products.filter(
        (product) => product.categoryName === category.name,
      ).length,
    }));
  });

  readonly leftPanelProducts = computed(() => {
    const filtered =
      this.selectedCategory() === "All"
        ? this.allProducts()
        : this.allProducts().filter(
            (product) => product.categoryName === this.selectedCategory(),
          );

    return filtered.slice(0, 6);
  });

  readonly colorPalette = [
    "#1A1A2E",
    "#FAF8F5",
    "#7AA7D9",
    "#FF6B4A",
    "#00C9A7",
    "#556B2F",
  ];

  readonly sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  readonly quickPrompts = [
    "Make it cream",
    "Add embroidery",
    "Try oversized fit",
  ];

  get currentProductImageUrl(): string {
    const selectedProduct = this.selectedProduct;
    const images = Array.isArray(selectedProduct?.images)
      ? selectedProduct.images
      : [];
    const activeImage = images.find(
      (image) => image.viewAngle === this.activeViewAngle,
    );
    const imageUrl =
      activeImage?.imageUrl || selectedProduct?.image || this.logo;

    if (!imageUrl) {
      return this.logo;
    }

    return resolveApiUrl(imageUrl) || this.logo;
  }

  get currentPrintableZone(): PrintableZoneBounds | null {
    const selectedProduct = this.selectedProduct;
    const images = Array.isArray(selectedProduct?.images)
      ? selectedProduct.images
      : [];
    const activeImage = images.find(
      (image) => image.viewAngle === this.activeViewAngle,
    );

    return this.parsePrintableZone(
      activeImage?.printableZone ?? activeImage?.printableZoneJson ?? null,
    );
  }

  constructor() {
    this.loadCategories();
    this.loadProducts();
  }

  private createDefaultProduct(): StudioProduct {
    return {
      id: "",
      name: "Untitled product",
      basePrice: 0,
      categoryName: "Uncategorized",
      previewImageUrl: "",
      isAvailable: false,
      averageRating: 0,
      image: this.logo,
      images: [],
      colors: ["#1A1A2E", "#FAF8F5", "#7AA7D9"],
      category: "Uncategorized",
      price: 0,
    };
  }

  private mapProduct(dto: ProductDto): StudioProduct {
    return {
      ...dto,
      image: dto.previewImageUrl
        ? resolveApiUrl(dto.previewImageUrl)
        : this.logo,
      images: [
        {
          id: "",
          productId: dto.id,
          imageUrl: dto.previewImageUrl ?? "",
          viewAngle: ViewAngle.Front,
          isPrimary: true,
          displayOrder: 0,
        },
      ],
      colors: this.getCategoryColors(dto.categoryName),
      category: dto.categoryName,
      price: Number(dto.basePrice),
    };
  }

  private getCategoryColors(categoryName: string): string[] {
    const paletteMap: Record<string, string[]> = {
      "T-Shirts": ["#1A1A2E", "#FAF8F5", "#7AA7D9"],
      Hoodies: ["#1A1A2E", "#556B2F", "#FF6B4A"],
      Pants: ["#556B2F", "#1A1A2E", "#FAF8F5"],
      Footwear: ["#7AA7D9", "#FF6B4A", "#00C9A7"],
      Headwear: ["#1A1A2E", "#FF6B4A", "#FAF8F5"],
    };

    return paletteMap[categoryName] ?? ["#1A1A2E", "#FAF8F5", "#7AA7D9"];
  }

  private loadProducts(): void {
    this.productLoading.set(true);
    this.productService.getProducts(1, 20).subscribe({
      next: (result) => {
        const mapped = result.data.map((dto) => this.mapProduct(dto));
        this.allProducts.set(mapped);
        if (mapped.length) {
          this.selected.set(mapped[0]);
          this.color.set(mapped[0].colors[0]);
        }
        this.productLoading.set(false);
      },
      error: () => {
        this.productLoading.set(false);
        this.loadError.set(true);
      },
    });
  }

  private loadCategories(): void {
    this.categoryLoading.set(true);
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.categoryLoading.set(false);
      },
      error: () => {
        this.categoryLoading.set(false);
        this.loadError.set(true);
      },
    });
  }

  setTab(t: StudioTab): void {
    this.tab.set(t);
    if (t === 'custom') {
      this.loadGraphicAssets();
    }
  }

  setSelectedCategory(categoryName: string): void {
    this.selectedCategory.set(categoryName);
  }

  setGraphicsSubTab(sub: 'mine' | 'gallery'): void {
    this.graphicsSubTab.set(sub);
  }

  private loadGraphicAssets(): void {
    this.assetsLoading.set(true);
    forkJoin({
      user: this.aiImageService.getUserGraphicAssets().pipe(catchError(() => of([]))),
      admin: this.aiImageService.getAdminGraphicAssets().pipe(catchError(() => of([]))),
    }).subscribe(({ user, admin }) => {
      this.userAssets.set(user);
      this.adminAssets.set(admin);
      this.assetsLoading.set(false);
      this.assetsLoaded = true;
    });
  }

  /** Called from the Graphics tab to add a gallery asset onto the canvas. */
  addAssetToCanvas(asset: GraphicAssetDto): void {
    if (!this.designCanvas) {
      this.toastService.error('Open the Canvas Editor first to add graphics.');
      return;
    }
    const url = this.resolveAssetImageUrl(asset.imageUrl);
    this.designCanvas.addGraphicAsset(url, asset.id);
  }

  resolveAssetImageUrl(url: string): string {
    if (!url) return this.logo;
    return resolveApiUrl(url) || url;
  }

  /** Delegates to the canvas toolbar's hidden file input. */
  triggerImageUpload(): void {
    if (!this.designCanvas) {
      this.toastService.error('Open the Canvas Editor first to upload images.');
      return;
    }
    this.designCanvas.triggerImageUpload();
  }

  /** Delegates delete of the selected canvas object. */
  deleteSelected(): void {
    this.designCanvas?.deleteSelectedObject();
  }

  toggleViewAngle(): void {
    this.activeViewAngle =
      this.activeViewAngle === ViewAngle.Front
        ? ViewAngle.Back
        : ViewAngle.Front;
  }

  setActiveViewAngle(viewAngle: ViewAngle): void {
    console.log(`[Studio] setActiveViewAngle`, {
      previousView: this.activeViewAngle,
      nextView: viewAngle,
    });
    this.activeViewAngle = viewAngle;
    console.log(`[Studio] activeViewAngle updated`, {
      activeViewAngle: this.activeViewAngle,
    });
  }

  selectProduct(productId: string): void {
    const product = this.allProducts().find((item) => item.id === productId);

    if (!product) {
      return;
    }

    this.selected.set({
      ...product,
      id: product.id,
      name: product.name,
      images: product.images ?? [],
    });
    this.color.set(product.colors[0]);
    this.activeViewAngle = ViewAngle.Front;

    this.productService.getProductImages(productId).subscribe({
      next: (images) => {
        const mappedImages = images.map((image) => ({
          ...image,
          viewAngle: image.viewAngle ?? ViewAngle.Front,
          printableZone: this.parsePrintableZone(
            image.printableZone ?? image.printableZoneJson ?? null,
          ),
        }));

        this.selected.update((current) => ({
          ...current,
          id: product.id,
          name: product.name,
          images: mappedImages,
          image:
            mappedImages.find((image) => image.viewAngle === ViewAngle.Front)
              ?.imageUrl || product.image,
        }));
      },
      error: () => {
        this.selected.update((current) => ({
          ...current,
          id: product.id,
          name: product.name,
          images: product.images ?? [],
        }));
      },
    });
  }

  pickColor(c: string): void {
    this.color.set(c);
  }

  pickSize(s: string): void {
    this.size.set(s);
  }

  pickFabric(value: number): void {
    this.selectedFabric.set(this.selectedFabric() === value ? null : value);
  }

  pickPrintMethod(value: number): void {
    this.selectedPrintMethod.set(this.selectedPrintMethod() === value ? null : value);
  }

  openCanvas(): void {
    this.canvasOpen.set(true);
  }

  closeCanvas(): void {
    this.canvasOpen.set(false);
  }

  openPay(): void {
    this.payOpen.set(true);
  }

  closePay(): void {
    this.payOpen.set(false);
  }

  setChatInput(v: string): void {
    this.chatInput.set(v);
  }

  useQuickPrompt(q: string): void {
    this.chatInput.set(q);
  }

  sendChat(): void {
    const value = this.chatInput().trim();
    if (!value || this.aiLoading()) return;

    this.messages.update((m) => [...m, { role: "user", text: value }]);
    this.aiLoading.set(true);

    this.aiImageService.generateAiImage(value).subscribe({
      next: (result) => {
        this.aiLoading.set(false);
        this.chatInput.set(""); // Clear prompt on success

        if (result && result.imageUrl) {
          const fullImageUrl = result.imageUrl.startsWith("http")
            ? result.imageUrl
            : `${this.baseApiUrl}${result.imageUrl}`;

          this.messages.update((m) => [
            ...m,
            {
              role: "ai",
              text: `Generated graphic for: "${value}"`,
              graphicAssetId: result.graphicAssetId,
              imageUrl: fullImageUrl,
            },
          ]);
        } else {
          this.toastService.error(
            "Failed to generate AI image. Invalid response.",
          );
        }
      },
      error: (err) => {
        this.aiLoading.set(false);
        // User prompt remains unchanged on error
        const errMsg =
          err?.error?.Message || err?.message || "Failed to generate AI image.";
        this.toastService.error(errMsg);
      },
    });
  }

  addToCanvas(imageUrl: string, graphicAssetId?: string): void {
    if (!imageUrl || !this.designCanvas) {
      return;
    }
    this.designCanvas.addGraphicAsset(imageUrl, graphicAssetId);
  }

  getProductImageUrlForAngle(angle: ViewAngle): string {
    const selectedProduct = this.selected();
    const images = Array.isArray(selectedProduct?.images)
      ? selectedProduct.images
      : [];
    const activeImage = images.find((image) => image.viewAngle === angle);
    const imageUrl =
      activeImage?.imageUrl ||
      (angle === ViewAngle.Front ? selectedProduct?.image : "") ||
      this.logo;

    if (!imageUrl) {
      return this.logo;
    }

    return resolveApiUrl(imageUrl) || this.logo;
  }

  /**
   * Captures front/back snapshots and persists the design via the API.
   * Returns the saved designId, or null on failure.
   * Used by both saveToDrafts() and addToCart().
   */
  private async executeSave(): Promise<string | null> {
    const selectedProduct = this.selected();

    if (!selectedProduct?.id || !this.designCanvas) {
      this.toastService.error("Please select a product before saving.");
      return null;
    }

    const originalViewAngle = this.activeViewAngle;
    const originalCanvasView: "front" | "back" =
      originalViewAngle === ViewAngle.Front ? "front" : "back";

    // 1. Persist the current editing state so both sides are saved in stateService
    this.designCanvas.saveCurrentViewState(originalCanvasView);

    const frontUrl = this.getProductImageUrlForAngle(ViewAngle.Front);
    const backUrl = this.getProductImageUrlForAngle(ViewAngle.Back);

    // 2. Sequentially capture front and back composite previews
    const base64Front = await this.designCanvas.captureViewSnapshot(
      "front",
      frontUrl,
    );
    const base64Back = await this.designCanvas.captureViewSnapshot(
      "back",
      backUrl,
    );

    // 3. Restore the view the user was editing
    await this.designCanvas.restoreViewSnapshot(originalCanvasView);

    // 4. The SnapshotImageURL represents the side being actively edited
    const base64Snapshot =
      originalCanvasView === "front" ? base64Front : base64Back;

    // 5. Build canvas state JSON (both sides are now saved in stateService)
    const canvasState = this.designCanvas.getCurrentCanvasState();

    return new Promise<string | null>((resolve, reject) => {
      this.productService
        .createDesign({
          id: null,
          productId: selectedProduct.id,
          templateId: null,
          canvasStateJSON: canvasState,
          base64Snapshot,
          base64Front,
          base64Back,
          selectedSize: this.mapSizeToEnum(this.size()),
          selectedFabric: this.selectedFabric(),
          selectedPrintMethod: this.selectedPrintMethod(),
          selectedColor: this.color(),
        })
        .subscribe({
          next: (designId) => {
            if (designId) {
              localStorage.setItem(this.lastDraftStorageKey, designId);
              this.currentDesignId.set(designId);
            }
            console.log("[Studio] design saved", { designId });
            resolve(designId);
          },
          error: (error) => {
            console.error("[Studio] failed to save design", error);
            reject(error);
          },
        });
    });
  }

  async saveToDrafts(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    try {
      const designId = await this.executeSave();

      if (designId) {
        // Load design details to retrieve the generated SnapshotImageURL
        this.productService.getDesignById(designId).subscribe({
          next: (design) => {
            if (design && design.snapshotImageURL) {
              this.saveSuccessPreviewUrl.set(
                resolveApiUrl(design.snapshotImageURL) || "",
              );
              this.saveSuccessOpen.set(true);
            } else {
              this.toastService.success("Design saved successfully!");
            }
          },
          error: () => {
            this.toastService.success("Design saved successfully!");
          },
        });
      }
    } catch (err: any) {
      console.error("[Studio] saveToDrafts error", err);
      const msg =
        err?.error?.Message ||
        err?.error?.message ||
        err?.message ||
        "Failed to save design.";
      this.toastService.error(msg);
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Add to Cart flow:
   * 1. If design has never been saved, execute Save first (auto-save is invisible to the user).
   * 2. Call Add to Cart API with ProductId + DesignId.
   * 3. Show success dialog.
   */
  async addToCart(): Promise<void> {
    const selectedProduct = this.selected();

    if (!selectedProduct?.id) {
      this.toastService.error("Please select a product before adding to cart.");
      return;
    }

    if (this.isAddingToCart() || this.isSaving()) {
      return;
    }

    this.isAddingToCart.set(true);

    try {
      let designId = this.currentDesignId();

      // Auto-save the design first if it hasn't been saved yet
      if (!designId) {
        console.log("[Studio] addToCart: design not saved, saving first…");
        try {
          designId = await this.executeSave();
        } catch (saveErr: any) {
          const msg =
            saveErr?.error?.Message ||
            saveErr?.error?.message ||
            saveErr?.message ||
            "Failed to save design before adding to cart.";
          this.toastService.error(msg);
          return;
        }
      }

      if (!designId) {
        this.toastService.error("Could not save design. Please try again.");
        return;
      }

      console.log("[Studio] addToCart: calling cart API", { productId: selectedProduct.id, designId });

      this.cartService
        .addToCart(selectedProduct.id, designId, 1)
        .subscribe({
          next: () => {
            console.log("[Studio] addToCart: success");
            this.cartSuccessOpen.set(true);
          },
          error: (err: any) => {
            console.error("[Studio] addToCart failed", err);
            const msg =
              err?.error?.Message ||
              err?.error?.message ||
              err?.message ||
              "Failed to add to cart. Please try again.";
            this.toastService.error(msg);
          },
        });
    } finally {
      this.isAddingToCart.set(false);
    }
  }

  onContinueDesigning(): void {
    this.cartSuccessOpen.set(false);
  }

  onViewCart(): void {
    this.cartSuccessOpen.set(false);
    this.router.navigate(['/cart']);
  }

  onPublishDesign(): void {
    this.saveSuccessOpen.set(false);
    this.toastService.success("Community publishing is coming soon.");
  }

  onCloseSaveSuccess(): void {
    this.saveSuccessOpen.set(false);
  }

  loadLatestDraft(): void {
    const savedDesignId = localStorage.getItem(this.lastDraftStorageKey);
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!savedDesignId || !uuidRegex.test(savedDesignId)) {
      return;
    }

    this.loadDesign(savedDesignId);
  }

  loadDesign(designId: string): void {
    if (!designId) {
      return;
    }

    this.productService.getDesignById(designId).subscribe({
      next: (design) => {
        if (!design) {
          return;
        }

        const product = this.allProducts().find(
          (p) => p.id === design.productId,
        );

        if (!product) {
          this.toastService.error(
            "Product associated with this design was not found.",
          );
          return;
        }

        // Pre-set colors, size, fabric and print method from design
        this.color.set(design.selectedColor ?? product.colors[0]);
        this.size.set(this.mapStoredSize(design.selectedSize));
        this.selectedFabric.set(this.mapStoredFabric(design.selectedFabric));
        this.selectedPrintMethod.set(this.mapStoredPrintMethod(design.selectedPrintMethod));

        // Fetch full product images and printable zones before canvas restoration
        this.productService.getProductImages(design.productId).subscribe({
          next: (images) => {
            const mappedImages = images.map((image) => ({
              ...image,
              viewAngle: image.viewAngle ?? ViewAngle.Front,
              printableZone: this.parsePrintableZone(
                image.printableZone ?? image.printableZoneJson ?? null,
              ),
            }));

            this.selected.set({
              ...product,
              images: mappedImages,
              image:
                mappedImages.find((img) => img.viewAngle === ViewAngle.Front)
                  ?.imageUrl || product.image,
            });

            // Set active angle from design JSON to match what was saved
            let activeView = ViewAngle.Front;
            try {
              if (design.canvasStateJSON) {
                const parsedState = JSON.parse(design.canvasStateJSON);
                if (parsedState && parsedState.activeView === "back") {
                  activeView = ViewAngle.Back;
                }
              }
            } catch (e) {
              console.error(
                "[Studio] Failed to parse activeView from canvasStateJSON",
                e,
              );
            }

            this.activeViewAngle = activeView;
            this.canvasOpen.set(true);

            requestAnimationFrame(() => {
              this.designCanvas?.restoreDesignState(design.canvasStateJSON);
            });
          },
          error: () => {
            // Fallback: use product default image if query fails
            this.selected.set({
              ...product,
              images: product.images ?? [],
            });
            this.canvasOpen.set(true);
            requestAnimationFrame(() => {
              this.designCanvas?.restoreDesignState(design.canvasStateJSON);
            });
          },
        });
      },
      error: (error) => {
        console.error("[Studio] failed to load design", error);
      },
    });
  }

  get originalPrice(): number {
    return this.selected().basePrice + 32;
  }

  private parsePrintableZone(zone: unknown): PrintableZoneBounds | null {
    if (!zone) {
      return null;
    }

    if (typeof zone === "string") {
      try {
        const parsed = JSON.parse(zone) as Partial<PrintableZoneBounds>;
        return this.parsePrintableZone(parsed);
      } catch {
        return null;
      }
    }

    if (typeof zone !== "object") {
      return null;
    }

    const candidate = zone as Record<string, unknown>;

    // Support both {left,top} (canvas format) and {x,y} (admin JSON format)
    const left = Number(candidate['left'] ?? candidate['x']);
    const top = Number(candidate['top'] ?? candidate['y']);
    const width = Number(candidate['width']);
    const height = Number(candidate['height']);

    if ([left, top, width, height].some((value) => !Number.isFinite(value))) {
      return null;
    }

    return {
      left,
      top,
      width,
      height,
    };
  }

  private mapSizeToEnum(size: string): number | null {
    switch (size) {
      case "XS":
        return 1;
      case "S":
        return 2;
      case "M":
        return 3;
      case "L":
        return 4;
      case "XL":
        return 5;
      case "XXL":
        return 6;
      case "XXXL":
        return 7;
      default:
        return null;
    }
  }

  private mapStoredFabric(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    const validValues = [1, 2, 4, 8, 16];
    return validValues.includes(num) ? num : null;
  }

  private mapStoredPrintMethod(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    const validValues = [1, 2, 4, 8, 16];
    return validValues.includes(num) ? num : null;
  }

  private mapStoredSize(sizeValue: string | null | undefined): string {
    const normalized = (sizeValue ?? "").trim().toUpperCase();

    switch (normalized) {
      case "1":
      case "XS":
        return "XS";
      case "2":
      case "S":
        return "S";
      case "3":
      case "M":
        return "M";
      case "4":
      case "L":
        return "L";
      case "5":
      case "XL":
        return "XL";
      case "6":
      case "XXL":
        return "XXL";
      case "7":
      case "XXXL":
        return "XXXL";
      default:
        return this.size();
    }
  }

  private createStableUserId(email: string): string {
    const normalized = (email || "guest").trim().toLowerCase();
    let hash = 0;

    for (let index = 0; index < normalized.length; index += 1) {
      hash = (hash << 5) - hash + normalized.charCodeAt(index);
      hash |= 0;
    }

    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    return `${hex.slice(0, 8)}-0000-4000-8000-${hex.slice(0, 12)}`;
  }
}
