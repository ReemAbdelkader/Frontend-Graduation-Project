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

  onCardClick(): void {
    this.cardClick.emit(this.product);
  }

  onHeartClick(event: Event): void {
    event.stopPropagation();
  }
}
