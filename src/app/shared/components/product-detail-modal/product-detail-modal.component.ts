import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { Product } from '../../../core/data/wearly-data';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  templateUrl: './product-detail-modal.component.html',
  styleUrl: './product-detail-modal.component.scss',
})
export class ProductDetailModalComponent {
  @Input({ required: true }) product!: Product;
  @Output() close = new EventEmitter<void>();

  private readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);

  readonly selectedImage = signal<string>('');
  readonly selectedColor = signal<string>('');
  readonly addingToCart = signal(false);

  ngOnInit(): void {
    this.syncSelection();
  }

  ngOnChanges(): void {
    this.syncSelection();
  }

  get hasReviewCount(): boolean {
    return typeof this.product.reviews === 'number';
  }

  get hasColors(): boolean {
    return (this.product.colors?.length ?? 0) > 0;
  }

  get galleryImages(): string[] {
    return this.product.galleryImages?.length ? this.product.galleryImages : [this.product.image].filter(Boolean);
  }

  selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  pickColor(c: string): void {
    this.selectedColor.set(c);
  }

  onAddToCart(): void {
    if (this.addingToCart()) return;
    this.addingToCart.set(true);

    this.cartService.addToCart(this.product.id).subscribe({
      next: (cart) => {
        if (cart) {
          this.toast.success(`${this.product.name} added to cart!`);
        } else {
          this.toast.success(`${this.product.name} added to cart!`);
        }
        this.addingToCart.set(false);
      },
      error: (err) => {
        const msg = err?.error?.Message || err?.error?.message || 'Failed to add to cart.';
        this.toast.error(msg);
        this.addingToCart.set(false);
      },
    });
  }

  private syncSelection(): void {
    this.selectedImage.set(this.galleryImages[0] ?? '');
    this.selectedColor.set(this.product.colors?.[0] ?? '');
  }
}