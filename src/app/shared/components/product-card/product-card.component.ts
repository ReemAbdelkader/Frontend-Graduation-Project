import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../core/data/wearly-data';

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() cardClick = new EventEmitter<Product>();

  get hasReviewCount(): boolean {
    return typeof this.product.reviews === 'number';
  }

  get hasColors(): boolean {
    return (this.product.colors?.length ?? 0) > 0;
  }

  onCardClick(): void {
    this.cardClick.emit(this.product);
  }
}
