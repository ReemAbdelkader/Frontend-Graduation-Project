import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductDetailModalComponent } from '../../shared/components/product-detail-modal/product-detail-modal.component';
import {
  products,
  shopBanner,
  Product,
  ProductCategory,
} from '../../core/data/wearly-data';

type CategoryFilter = 'All' | ProductCategory;

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
  readonly banner = shopBanner;
  readonly allProducts = products;

  readonly categories: CategoryFilter[] = [
    'All',
    'T-Shirts',
    'Hoodies',
    'Pants',
    'Footwear',
    'Headwear',
  ];

  readonly selectedCat = signal<CategoryFilter>('All');
  readonly openProduct = signal<Product | null>(null);

  readonly filteredProducts = computed(() => {
    const cat = this.selectedCat();
    if (cat === 'All') return this.allProducts;
    return this.allProducts.filter((p) => p.category === cat);
  });

  selectCat(c: CategoryFilter): void {
    this.selectedCat.set(c);
  }

  openDetail(p: Product): void {
    this.openProduct.set(p);
  }

  closeDetail(): void {
    this.openProduct.set(null);
  }
}
