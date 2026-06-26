import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { NotificationService } from '../../../core/services/notification.service';

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
  @Output() close = new EventEmitter<void>();

  readonly cardNumber = signal('');
  readonly expiry = signal('');
  readonly cvc = signal('');
  readonly name = signal('');
  readonly paid = signal(false);
  readonly isProcessing = signal(false);

  constructor(
    private readonly orderService: OrderService,
    private readonly notifService: NotificationService
  ) {}

  pay(): void {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);

    const orderPayload = {
      productName: this.productName,
      productImage: this.productImage,
      amount: this.price * 1.08, 
      cardHolderName: this.name(),
      cardNumber: this.cardNumber(),
      expiry: this.expiry(),
      cvc: this.cvc()
    };

    this.orderService.createOrder(orderPayload).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.paid.set(true);
          if (response.notification) {
            this.notifService.pushNewNotification(response.notification);
          }
        } else {
          console.error('Payment failed or returned invalid data');
        }
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Payment failed', err);
        this.isProcessing.set(false);
      }
    });
  }
}