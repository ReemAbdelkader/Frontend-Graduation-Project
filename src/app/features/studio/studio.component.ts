import { Component, inject, signal, computed, ViewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CheckoutPayModalComponent } from "../../shared/components/checkout-pay-modal/checkout-pay-modal.component";
import { DesignCanvasComponent } from "../../shared/components/design-canvas/design-canvas.component";
import { ProductService } from "../../core/services/product.service";
import { AuthService } from "../../core/services/auth.service";
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

@Component({
  selector: "app-studio",
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    CheckoutPayModalComponent,
    DesignCanvasComponent,
  ],
  templateUrl: "./studio.component.html",
  styleUrl: "./studio.component.scss",
})
export class StudioComponent {
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly lastDraftStorageKey = "atelier-last-design-id";

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
  readonly selected = signal<StudioProduct>(this.createDefaultProduct());
  activeViewAngle: ViewAngle = ViewAngle.Front;

  get selectedProduct(): StudioProduct {
    return this.selected();
  }
  readonly color = signal<string>("#1A1A2E");
  readonly size = signal<string>("L");
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

  readonly fabricOptions = [
    "French Terry 380gsm",
    "Heavyweight 400gsm",
    "Organic Cotton 220gsm",
  ];

  readonly sizes = ["XS", "S", "M", "L", "XL", "XXL"];

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

    return /^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:")
      ? imageUrl
      : `${this.baseApiUrl}${imageUrl}`;
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
        ? `${this.baseApiUrl}${dto.previewImageUrl}`
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
  }

  setSelectedCategory(categoryName: string): void {
    this.selectedCategory.set(categoryName);
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
    if (!value) return;
    this.messages.update((m) => [...m, { role: "user", text: value }]);
    this.chatInput.set("");
    setTimeout(() => {
      this.messages.update((m) => [
        ...m,
        {
          role: "ai",
          text: "Got it — I'll restyle the current piece around that direction and refresh the mannequin preview.",
        },
      ]);
    }, 700);
  }

  async saveToDrafts(): Promise<void> {
    const selectedProduct = this.selected();

    if (!selectedProduct?.id || !this.designCanvas) {
      return;
    }

    const snapshotUrl = await this.designCanvas.exportCurrentDesignSnapshot();
    const canvasState = this.designCanvas.getCurrentCanvasState();
    const currentUser = this.authService.user();
    const userId = currentUser?.email
      ? this.createStableUserId(currentUser.email)
      : this.createStableUserId("guest");

    this.productService
      .createDesign({
        userId,
        productId: selectedProduct.id,
        templateId: null,
        canvasStateJSON: canvasState,
        snapshotImageURL: snapshotUrl ?? "",
        selectedSize: this.mapSizeToEnum(this.size()),
        selectedFabric: null,
        selectedPrintMethod: null,
        selectedColor: this.color(),
      })
      .subscribe({
        next: (designId) => {
          if (designId) {
            localStorage.setItem(this.lastDraftStorageKey, designId);
          }
          console.log("[Studio] design saved", { designId, snapshotUrl });
        },
        error: (error) => {
          console.error("[Studio] failed to save design", error);
        },
      });
  }

  loadLatestDraft(): void {
    const savedDesignId = localStorage.getItem(this.lastDraftStorageKey);

    if (!savedDesignId) {
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

        const existingProduct = this.allProducts().find(
          (product) => product.id === design.productId,
        );

        if (existingProduct) {
          this.selected.set({
            ...existingProduct,
            images: existingProduct.images ?? [],
          });
        }

        this.color.set(design.selectedColor ?? this.color());
        this.size.set(this.mapStoredSize(design.selectedSize));
        this.canvasOpen.set(true);

        requestAnimationFrame(() => {
          this.designCanvas?.restoreDesignState(design.canvasStateJSON);
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

    const candidate = zone as Partial<PrintableZoneBounds>;

    const left = Number(candidate.left);
    const top = Number(candidate.top);
    const width = Number(candidate.width);
    const height = Number(candidate.height);

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
