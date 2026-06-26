import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductDetailModalComponent } from '../../shared/components/product-detail-modal/product-detail-modal.component';
import { shopBanner, Product } from '../../core/data/wearly-data';
import { CategoryDto } from '../../core/services/templates-api.service';
import { ProductDto, ProductImageDto, ShopApiService } from '../../core/services/shop-api.service';

interface CategoryFilter {
  id: string | null;
  name: string;
}

const ALL_CATEGORIES: CategoryFilter = { id: null, name: 'All' };

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    RouterLink,
    AppNavComponent,
    ProductCardComponent,
    ProductDetailModalComponent,
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent {
  private readonly api = inject(ShopApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly banner = shopBanner;
  readonly pageSize = 12;

  readonly products = signal<Product[]>([]);
  readonly categories = signal<CategoryFilter[]>([ALL_CATEGORIES]);
  readonly selectedCat = signal<CategoryFilter>(ALL_CATEGORIES);
  readonly openProduct = signal<Product | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalCount = signal(0);

  constructor() {
    this.loadCategories();
    this.loadProducts();
  }

  selectCat(c: CategoryFilter): void {
    this.selectedCat.set(c);
    this.loadProducts();
  }

  openDetail(p: Product): void {
    this.openProduct.set(p);

    forkJoin({
      product: this.api.getProduct(p.id).pipe(catchError(() => of(null))),
      images: this.api.getProductImages(p.id).pipe(catchError(() => of([] as ProductImageDto[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ product, images }) => {
        const source = product ? this.toProduct(product) : p;
        this.openProduct.set({
          ...source,
          galleryImages: this.galleryImages(source.image, images),
        });
      });
  }

  closeDetail(): void {
    this.openProduct.set(null);
  }

  categoryTrackId(category: CategoryFilter): string {
    return category.id ?? 'all';
  }

  private loadCategories(): void {
    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set([ALL_CATEGORIES, ...categories.map((category) => this.toCategoryFilter(category))]);
        },
        error: () => this.categories.set([ALL_CATEGORIES]),
      });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .getProducts(1, this.pageSize, this.selectedCat().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.products.set(result.data.map((product) => this.toProduct(product)));
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.totalCount.set(0);
          this.loading.set(false);
          this.error.set('Shop products are unavailable right now.');
        },
      });
  }

  private toCategoryFilter(category: CategoryDto): CategoryFilter {
    return {
      id: category.id,
      name: category.name,
    };
  }

  private toProduct(product: ProductDto): Product {
    return {
      id: product.id,
      name: product.name,
      category: product.categoryName,
      price: Number(product.basePrice),
      rating: Number(product.averageRating),
      reviews: typeof product.reviewCount === 'number' ? product.reviewCount : undefined,
      image: this.api.resolveImageUrl(product.previewImageUrl),
      colors: [],
      isAvailable: product.isAvailable,
    };
  }

  private galleryImages(previewImage: string, images: ProductImageDto[]): string[] {
    const urls = images
      .map((image) => this.api.resolveImageUrl(image.imageUrl))
      .filter(Boolean);

    return Array.from(new Set([previewImage, ...urls].filter(Boolean)));
  }
}
