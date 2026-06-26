import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { Product } from '../../../core/data/wearly-data';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  templateUrl: './product-detail-modal.component.html',
  styleUrl: './product-detail-modal.component.scss',
})
export class ProductDetailModalComponent {
  @Input({ required: true }) product!: Product;
  @Output() close = new EventEmitter<void>();

  readonly selectedImage = signal<string>('');
  readonly selectedColor = signal<string>('');

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
    // TODO: No Cart API exists yet in the backend. Blocked until a Cart/CartItem endpoint is added. See OrdersController for the eventual checkout call once cart contents need to convert to a real order.
  }

  private syncSelection(): void {
    this.selectedImage.set(this.galleryImages[0] ?? '');
    this.selectedColor.set(this.product.colors?.[0] ?? '');
  }
}
