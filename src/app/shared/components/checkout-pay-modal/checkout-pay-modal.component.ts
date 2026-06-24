import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  pay(): void {
    this.paid.set(true);
  }
}
