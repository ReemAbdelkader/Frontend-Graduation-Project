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

  readonly selectedColor = signal<string>('');
  readonly selectedSize = signal<string>('M');

  ngOnInit(): void {
    this.selectedColor.set(this.product.colors[0]);
  }

  pickColor(c: string): void {
    this.selectedColor.set(c);
  }

  pickSize(s: string): void {
    this.selectedSize.set(s);
  }

  get sizes(): string[] {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }

  get originalPrice(): number {
    return this.product.price + 32;
  }
}
