import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { OrderService, CreateOrderPayload, CreateOrderItemPayload } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CartItemDto } from '../../../core/models/shop.models';

@Component({
  selector: 'app-checkout-pay-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './checkout-pay-modal.component.html',
  styleUrl: './checkout-pay-modal.component.scss',
})
export class CheckoutPayModalComponent {
  @Input({ required: true }) productName!: string;
  @Input({ required: true }) productImage!: string;
  @Input({ required: true }) price!: number;
  @Input() designId?: string;
  @Input() cartItems?: CartItemDto[] | null;
  @Output() close = new EventEmitter<void>();

  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);

  readonly receiverName = signal('');
  readonly phoneNumber = signal('');
  readonly address = signal('');
  readonly city = signal('');
  readonly deliveryNotes = signal('');
  readonly couponCode = signal('');
  readonly isProcessing = signal(false);
  readonly paymentSuccess = signal(false);

  pay(): void {
    if (this.isProcessing()) return;

    const userId = this.authService.userId();
    if (!userId) {
      this.toast.error('Please log in to place an order.');
      return;
    }

    if (!this.receiverName().trim() || !this.phoneNumber().trim() || !this.address().trim() || !this.city().trim()) {
      this.toast.error('Please fill in all required shipping fields.');
      return;
    }

    const orderItems = this.buildOrderItems();
    if (!orderItems) return;

    this.isProcessing.set(true);

    const payload: CreateOrderPayload = {
      userId,
      receiverName: this.receiverName().trim(),
      phoneNumber: this.phoneNumber().trim(),
      address: this.address().trim(),
      city: this.city().trim(),
      deliveryNotes: this.deliveryNotes().trim() || null,
      couponCode: this.couponCode().trim() || null,
      orderItems,
    };

    this.orderService.createOrder(payload).subscribe({
      next: (result) => {
        if (!result.success) {
          this.isProcessing.set(false);
          this.toast.error(result.message || 'Failed to create order. Please try again.');
          return;
        }

        setTimeout(() => this.completePayment(), 800);
      },
      error: () => {
        this.isProcessing.set(false);
        this.toast.error('Something went wrong. Please try again.');
      },
    });
  }

  goToOrders(): void {
    this.close.emit();
    this.router.navigate(['/orders'], { queryParams: { fromCheckout: 'true' } });
  }

  onOverlayClick(): void {
    if (!this.paymentSuccess() && !this.isProcessing()) {
      this.close.emit();
    }
  }

  private buildOrderItems(): CreateOrderItemPayload[] | null {
    if (this.cartItems && this.cartItems.length > 0) {
      const missingDesign = this.cartItems.filter((item) => !this.isValidDesignId(item.designId));
      if (missingDesign.length > 0) {
        this.toast.error('Some items need a custom design. Open Studio via Customize before checkout.');
        return null;
      }

      return this.cartItems.map((item) => ({
        designId: item.designId!.trim(),
        quantity: item.quantity,
        printerProfileId: null,
      }));
    }

    if (this.isValidDesignId(this.designId)) {
      return [{ designId: this.designId!.trim(), quantity: 1, printerProfileId: null }];
    }

    this.toast.error('No design found for checkout. Save your design in Studio first.');
    return null;
  }

  private isValidDesignId(designId?: string | null): boolean {
    if (!designId || designId === 'cart' || designId === 'default') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(designId);
  }

  private completePayment(): void {
    const finishPayment = (): void => {
      this.isProcessing.set(false);
      this.paymentSuccess.set(true);
      this.toast.success('Payment successful!');

      setTimeout(() => this.goToOrders(), 2500);
    };

    if (this.cartItems && this.cartItems.length > 0) {
      this.cartService.clearCart().subscribe({
        next: () => finishPayment(),
        error: () => finishPayment(),
      });
      return;
    }

    finishPayment();
  }
}
