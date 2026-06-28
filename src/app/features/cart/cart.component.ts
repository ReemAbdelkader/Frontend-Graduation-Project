import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { CheckoutPayModalComponent } from '../../shared/components/checkout-pay-modal/checkout-pay-modal.component';
import { ToastService } from '../../core/services/toast.service';
import { CartItemDto } from '../../core/models/shop.models';
import { resolveApiUrl } from '../../core/services/api-config';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AppNavComponent,
    CheckoutPayModalComponent,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly showCheckoutModal = signal(false);

  ngOnInit(): void {
    if (!this.cartService.items().length) {
      this.cartService.loadCart();
    }
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

  continueShopping(): void {
    this.router.navigate(['/shop']);
  }

  openCheckout(): void {
    if (this.cartService.items().length === 0) {
      this.toast.error('Your cart is empty.');
      return;
    }

    const missingDesign = this.cartService.items().filter((item) => !this.hasDesign(item));
    if (missingDesign.length > 0) {
      this.toast.error('Customize your items in Studio before checkout.');
      return;
    }

    this.showCheckoutModal.set(true);
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
  }

  goToCustomize(item: CartItemDto): void {
    this.router.navigate(['/studio'], { queryParams: { productId: item.productId } });
  }

  hasDesign(item: CartItemDto): boolean {
    const designId = item.designId?.trim();
    if (!designId) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(designId);
  }

  get canCheckout(): boolean {
    return this.cartService.items().length > 0 && this.cartService.items().every((item) => this.hasDesign(item));
  }
}
