import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { resolveApiUrl } from '../../../core/services/api-config';
import { CartItemDto } from '../../../core/models/shop.models';

@Component({
  selector: 'app-cart-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-dropdown.component.html',
  styleUrl: './cart-dropdown.component.scss',
})
export class CartDropdownComponent {
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly closing = signal(false);

  toggle(): void {
    if (this.closing()) {
      return;
    }

    if (!this.open()) {
      this.cartService.loadCart();
      this.open.set(true);
      return;
    }

    this.close();
  }

  close(): void {
    if (!this.open()) {
      return;
    }

    this.closing.set(true);
    window.setTimeout(() => {
      this.open.set(false);
      this.closing.set(false);
    }, 180);
  }

  getThumbnailUrl(item: CartItemDto): string {
    const rawUrl = item.designSnapshotImageUrl || item.productImage;
    if (!rawUrl) {
      return 'assets/wearly-logo.png';
    }
    return resolveApiUrl(rawUrl);
  }

  increaseQuantity(item: CartItemDto): void {
    if (this.cartService.updatingItemId() === item.cartItemId) return;
    this.cartService.updateQuantity(item.cartItemId, item.quantity + 1).subscribe();
  }

  decreaseQuantity(item: CartItemDto): void {
    if (this.cartService.updatingItemId() === item.cartItemId) return;
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.cartItemId, item.quantity - 1).subscribe();
    } else {
      this.removeItem(item);
    }
  }

  removeItem(item: CartItemDto): void {
    if (this.cartService.updatingItemId() === item.cartItemId) return;
    this.cartService.removeItem(item.cartItemId).subscribe();
  }

  clearAll(): void {
    if (this.cartService.loading()) return;
    this.cartService.clearCart().subscribe();
  }

  goToCheckout(): void {
    this.close();
    this.router.navigate(['/cart']);
  }
}
