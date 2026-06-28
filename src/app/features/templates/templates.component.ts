import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, map, of, catchError, switchMap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AppNavComponent } from "../../shared/components/app-nav/app-nav.component";
import {
  TemplateDetailDto,
  TemplateDto,
  TemplatesApiService,
} from "../../core/services/templates-api.service";
import { AuthService } from "../../core/services/auth.service";
import {
  AiImageService,
  GenerateAiImageResult,
  GraphicAssetDto,
} from "../../core/services/ai-image.service";
import {
  OnboardingApiService,
  UserPreferencesResponse,
} from "../../core/services/onboarding-api.service";
import { resolveApiUrl } from "../../core/services/api-config";
import { CartService } from "../../core/services/cart.service";
import { ProductService } from "../../core/services/product.service";
import { ToastService } from "../../core/services/toast.service";

type TabType = "public" | "mine" | "my-templates";

@Component({
  selector: "app-templates",
  standalone: true,
  imports: [CommonModule, AppNavComponent],
  templateUrl: "./templates.component.html",
  styleUrl: "./templates.component.scss",
})
export class TemplatesComponent implements OnInit {
  private readonly api = inject(TemplatesApiService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly aiImageService = inject(AiImageService);
  private readonly onboardingApi = inject(OnboardingApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly toastService = inject(ToastService);

  readonly templates = signal<TemplateDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pageNumber = signal(1);
  readonly pageSize = 12;
  readonly totalPages = signal(0);
  readonly totalCount = signal(0);
  readonly categoryNames = signal<Record<string, string>>({});
  readonly creatorNames = signal<Record<string, string>>({});
  readonly selectedTemplate = signal<TemplateDetailDto | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly activeTab = signal<TabType>("public");
  readonly addingTemplateToCartId = signal<string | null>(null);

  // ── My Templates (onboarding AI generation & user assets) ──────────────
  readonly myImages = signal<GraphicAssetDto[]>([]);
  readonly generatingMyImages = signal(false);
  readonly generationError = signal<string | null>(null);
  /** Tracks how many of the 6 images have finished */
  readonly generationProgress = signal(0);
  private myImagesLoaded = false;

  readonly isLoggedIn = this.auth.isLoggedIn;

  readonly hasPreviousPage = computed(() => this.pageNumber() > 1);
  readonly hasNextPage = computed(() => this.pageNumber() < this.totalPages());

  constructor() {
    this.loadCategories();
    this.loadPage(1);
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const tab = params.get("tab") as TabType | null;
    const generate = params.get("generate") === "true";

    if (tab === "my-templates") {
      this.activeTab.set("my-templates");
      this.templates.set([]);

      if (generate) {
        // Clear the generate param from the url so refreshes won't re-trigger it
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { generate: null },
          queryParamsHandling: "merge",
        });
        this.loadMyTemplateImages();
      } else {
        this.loadUserGraphicAssets();
      }
    } else if (tab && ["public", "mine"].includes(tab)) {
      if (tab !== this.activeTab()) {
        this.switchTab(tab);
      }
    }
  }

  switchTab(tab: TabType): void {
    if (tab === this.activeTab()) return;
    this.activeTab.set(tab);

    if (tab === "my-templates") {
      this.templates.set([]);
      // When visiting this tab, load existing graphic assets. Do not trigger generation.
      this.loadUserGraphicAssets();
      return;
    }

    this.pageNumber.set(1);
    this.totalPages.set(0);
    this.totalCount.set(0);
    this.templates.set([]);
    this.loadPage(1);
  }

  loadPage(pageNumber: number): void {
    if (pageNumber < 1) return;

    const totalPages = this.totalPages();
    if (totalPages > 0 && pageNumber > totalPages) return;

    this.loading.set(true);
    this.error.set(null);

    const fetch$ =
      this.activeTab() === "mine"
        ? this.api.getMyTemplates(pageNumber, this.pageSize)
        : this.api.getPublicTemplates(pageNumber, this.pageSize);

    fetch$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.templates.set(result.data);
        this.pageNumber.set(result.currentPage);
        this.totalPages.set(result.totalPages);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
        this.loadCreatorNames(result.data);
      },
      error: () => {
        this.templates.set([]);
        this.loading.set(false);
        this.error.set("Templates are unavailable right now.");
      },
    });
  }

  // ── My Templates Loading & Generation ───────────────────────────────────

  /** Loads the user's existing graphic assets sorted by date (most recent first) */
  loadUserGraphicAssets(): void {
    this.loading.set(true);
    this.error.set(null);
    this.aiImageService
      .getUserGraphicAssets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assets) => {
          // The backend already sorts by CreatedAt descending.
          this.myImages.set(assets);
          this.myImagesLoaded = true;
          this.loading.set(false);
        },
        error: () => {
          this.myImages.set([]);
          this.loading.set(false);
          this.error.set(
            "Failed to load your graphic assets. Please try again.",
          );
        },
      });
  }

  /** Fetches user preferences then fires 6 generate-image calls in parallel. */
  private loadMyTemplateImages(): void {
    this.generatingMyImages.set(true);
    this.generationError.set(null);
    this.generationProgress.set(0);
    this.myImages.set([]);

    this.onboardingApi
      .getPreferences()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((prefs) => {
          const prompts = this.buildOnboardingPrompts(prefs);
          // Fire all 6 requests simultaneously; individual failures return null
          return forkJoin(
            prompts.map((prompt) =>
              this.aiImageService
                .generateAiImage(prompt)
                .pipe(
                  catchError(() => of(null as GenerateAiImageResult | null)),
                ),
            ),
          );
        }),
        catchError(() => of([] as (GenerateAiImageResult | null)[])),
      )
      .subscribe({
        next: (results) => {
          const valid = results.filter(
            (r): r is GenerateAiImageResult => r !== null,
          );
          this.generationProgress.set(valid.length);
          this.myImagesLoaded = true;
          this.generatingMyImages.set(false);

          if (valid.length === 0) {
            this.generationError.set(
              "Image generation failed. Please try again — it may have been a temporary server issue.",
            );
          } else {
            // Load user assets which now contains the newly generated ones sorted at the top!
            this.loadUserGraphicAssets();
          }
        },
        error: () => {
          this.generatingMyImages.set(false);
          this.generationError.set(
            "Could not reach the AI service. Check your connection and try again.",
          );
        },
      });
  }

  retryGeneration(): void {
    this.myImagesLoaded = false;
    this.myImages.set([]);
    this.generationError.set(null);
    this.loadMyTemplateImages();
  }

  resolveImageUrl(url: string): string {
    return resolveApiUrl(url);
  }

  useInStudio(): void {
    const t = this.selectedTemplate();
    if (t) {
      this.useTemplateInStudio(t.id);
    } else {
      this.router.navigate(["/studio"]);
    }
  }

  useTemplateInStudio(templateId: string): void {
    this.router.navigate(["/studio"], {
      queryParams: { templateId },
    });
  }

  addTemplateToCart(templateId: string): void {
    if (!templateId) return;
    if (this.addingTemplateToCartId() === templateId) return;

    if (!this.auth.isLoggedIn()) {
      this.toastService.error("Please log in to add designs to your cart.");
      return;
    }

    this.addingTemplateToCartId.set(templateId);
    this.error.set(null);

    this.api
      .getTemplate(templateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (template) => {
          if (!template?.canvasStateJSON) {
            this.toastService.error("This template has no canvas data.");
            this.addingTemplateToCartId.set(null);
            return;
          }

          this.productService
            .getProducts(1, 100)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (result) => {
                const categoryName =
                  this.categoryNames()[template.categoryId] ?? null;
                const matchedProduct =
                  (categoryName
                    ? result.data.find(
                        (product) =>
                          product.categoryName?.toLowerCase() ===
                          categoryName.toLowerCase(),
                      )
                    : null) ??
                  result.data[0] ??
                  null;

                if (!matchedProduct) {
                  this.toastService.error(
                    "No product is available for this template right now.",
                  );
                  this.addingTemplateToCartId.set(null);
                  return;
                }

                this.productService
                  .createDesign({
                    id: null,
                    productId: matchedProduct.id,
                    templateId: template.id,
                    canvasStateJSON: template.canvasStateJSON ?? "{}",
                    base64Snapshot: null,
                    base64Front: null,
                    base64Back: null,
                    selectedSize: null,
                    selectedFabric: null,
                    selectedPrintMethod: null,
                    selectedColor: null,
                  })
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                    next: (designId) => {
                      if (!designId) {
                        this.toastService.error(
                          "Could not save this design. Please try again.",
                        );
                        this.addingTemplateToCartId.set(null);
                        return;
                      }

                      this.cartService
                        .addToCart(matchedProduct.id, designId, 1)
                        .subscribe({
                          next: () => {
                            this.toastService.success(
                              "Added this design to cart.",
                            );
                          },
                          error: (err: any) => {
                            const msg =
                              err?.error?.Message ||
                              err?.error?.message ||
                              err?.message ||
                              "Failed to add this design to cart.";
                            this.toastService.error(msg);
                          },
                          complete: () => {
                            this.addingTemplateToCartId.set(null);
                          },
                        });
                    },
                    error: (err: any) => {
                      const msg =
                        err?.error?.Message ||
                        err?.error?.message ||
                        err?.message ||
                        "Failed to save this design. Please try again.";
                      this.toastService.error(msg);
                      this.addingTemplateToCartId.set(null);
                    },
                  });
              },
              error: () => {
                this.toastService.error(
                  "Unable to load products for this template.",
                );
                this.addingTemplateToCartId.set(null);
              },
            });
        },
        error: () => {
          this.toastService.error(
            "Template details are unavailable right now.",
          );
          this.addingTemplateToCartId.set(null);
        },
      });
  }

  /**
   * Builds 6 distinct preference-aware prompts.
   * Every prompt enforces a transparent / no-background requirement
   * so the generated graphic is ready to be placed directly on clothing.
   */
  private buildOnboardingPrompts(prefs: UserPreferencesResponse): string[] {
    const style = prefs.styleType || "Streetwear";
    const colors = prefs.favoriteColors || "Black, White";
    const avoid = prefs.bannedColors
      ? `Strictly avoid these colors: ${prefs.bannedColors}.`
      : "";
    const interests = prefs.interests || "Art, Music";
    const designType = prefs.designPreference || "Bold Prints";

    const themes = [
      `${interests} inspired emblem artwork`,
      `${style} culture graphic motif`,
      `Abstract composition using ${colors} palette`,
      `${interests} conceptual illustration`,
      `${style} aesthetic statement graphic`,
      `${colors} geometric pattern with ${designType} energy`,
    ];

    return themes.map(
      (theme, i) =>
        `Isolated vector graphic for direct-to-garment clothing print. ` +
        `CRITICAL: fully transparent background, no white fill, no background elements, cutout PNG style, alpha channel. ` +
        `Theme: ${theme}. Style aesthetic: ${style}. Color palette: ${colors}. ${avoid} ` +
        `Design mood: ${designType}. High-contrast, ultra-detailed, print-ready art. ` +
        `No photographic backgrounds, no gradients behind the subject. Variation ${i + 1} of 6.`,
    );
  }

  // ── Shared helpers ──────────────────────────────────────────────────────

  openTemplate(id: string): void {
    this.selectedTemplate.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);

    this.api
      .getTemplate(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (template) => {
          this.selectedTemplate.set(template);
          this.detailLoading.set(false);
          this.loadCreatorNames([template]);
        },
        error: () => {
          this.detailLoading.set(false);
          this.detailError.set("Template details are unavailable right now.");
        },
      });
  }

  closeTemplate(): void {
    this.selectedTemplate.set(null);
    this.detailError.set(null);
    this.detailLoading.set(false);
  }

  previewUrl(template: TemplateDto): string {
    return this.api.resolvePreviewUrl(template.previewImageURL);
  }

  styleTags(template: TemplateDto): string[] {
    return (template.styleTags ?? "")
      .split(/[,;|·]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  categoryName(categoryId: string): string | null {
    return this.categoryNames()[categoryId] ?? null;
  }

  creatorName(creatorUserId: string): string | null {
    return this.creatorNames()[creatorUserId] ?? null;
  }

  bgClass(i: number): string {
    return `bg-${i % 4}`;
  }

  private loadCategories(): void {
    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categoryNames.set(
            categories.reduce<Record<string, string>>((acc, cat) => {
              acc[cat.id] = cat.name;
              return acc;
            }, {}),
          );
        },
        error: () => this.categoryNames.set({}),
      });
  }

  private loadCreatorNames(templates: TemplateDto[]): void {
    const knownCreators = this.creatorNames();
    const creatorIds = Array.from(
      new Set(templates.map((t) => t.creatorUserId)),
    ).filter((id) => id && knownCreators[id] === undefined);

    if (creatorIds.length === 0) return;

    forkJoin(
      creatorIds.map((id) =>
        this.api.getProfile(id).pipe(
          map((profile) => [id, profile.name || profile.userName] as const),
          catchError(() => of([id, ""] as const)),
        ),
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((entries) => {
        this.creatorNames.update((current) => {
          const next = { ...current };
          for (const [id, name] of entries) next[id] = name;
          return next;
        });
      });
  }
}
