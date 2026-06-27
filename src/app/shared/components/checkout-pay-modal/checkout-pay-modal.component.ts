import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService, CreateOrderPayload, CreateOrderItemPayload } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

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
  @Output() close = new EventEmitter<void>();

  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly receiverName = signal('');
  readonly phoneNumber = signal('');
  readonly address = signal('');
  readonly city = signal('');
  readonly deliveryNotes = signal('');
  readonly couponCode = signal('');
  readonly isProcessing = signal(false);

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

    if (!this.designId) {
      this.toast.error('Design information is missing. Please try again from the product page.');
      return;
    }

    this.isProcessing.set(true);

    const orderItems: CreateOrderItemPayload[] = [
      { designId: this.designId, quantity: 1 }
    ];

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
      next: (stripeUrl) => {
        this.isProcessing.set(false);
        if (stripeUrl) {
          window.location.href = stripeUrl;
        } else {
          this.toast.error('Failed to create order. Please try again.');
        }
      },
      error: () => {
        this.isProcessing.set(false);
        this.toast.error('Something went wrong. Please try again.');
      },
    });
  }
}