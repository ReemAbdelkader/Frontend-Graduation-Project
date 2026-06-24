import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface Coupon {
  id: string;
  code: string;
  discount: string;
  uses: number;
  expires: string;
  discountType: 'percentage' | 'free-shipping';
  value: number;
}

@Component({
  selector: 'app-admin-rewards',
  standalone: true,
  imports: [FormsModule, DatePipe, ConfirmDialogComponent],
  templateUrl: './rewards.component.html',
  styleUrl: './rewards.component.scss',
})
export class RewardsComponent {
  private toast = inject(ToastService);

  readonly coupons = signal<Coupon[]>([
    { id: 'cp1', code: 'WEARLY10',  discount: '10%',          uses: 248,  expires: '2026-07-31', discountType: 'percentage',   value: 10 },
    { id: 'cp2', code: 'SHIPFREE',  discount: 'Free shipping', uses: 1820, expires: '2026-12-31', discountType: 'free-shipping', value: 0  },
    { id: 'cp3', code: 'ATELIER20', discount: '20%',          uses: 41,   expires: '2026-06-30', discountType: 'percentage',   value: 20 },
  ]);

  // Modal state
  readonly showCouponModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly formCode = signal('');
  readonly formDiscountType = signal<'percentage' | 'free-shipping'>('percentage');
  readonly formValue = signal(10);
  readonly formExpiry = signal('');
  readonly saving = signal(false);

  // Delete confirm
  readonly deleteTarget = signal<Coupon | null>(null);

  readonly stats = [
    { label: 'Active coupons', value: 3 },
    { label: 'Total redemptions', value: '2,109' },
    { label: 'Badges issued', value: '3,418' },
  ];

  // ============ Modal ============
  openCreateCoupon(): void {
    this.editingId.set(null);
    this.formCode.set('');
    this.formDiscountType.set('percentage');
    this.formValue.set(10);
    this.formExpiry.set('');
    this.showCouponModal.set(true);
  }

  openEditCoupon(c: Coupon): void {
    this.editingId.set(c.id);
    this.formCode.set(c.code);
    this.formDiscountType.set(c.discountType);
    this.formValue.set(c.value);
    this.formExpiry.set(c.expires);
    this.showCouponModal.set(true);
  }

  closeCouponModal(): void {
    this.showCouponModal.set(false);
  }

  setDiscountType(v: 'percentage' | 'free-shipping'): void {
    this.formDiscountType.set(v);
  }

  saveCoupon(): void {
    const code = this.formCode().trim().toUpperCase();
    if (!code) {
      this.toast.error('Coupon code is required.');
      return;
    }
    if (!this.formExpiry()) {
      this.toast.error('Expiry date is required.');
      return;
    }

    const discountType = this.formDiscountType();
    const value = this.formValue();
    const discount = discountType === 'free-shipping' ? 'Free shipping' : `${value}%`;

    const id = this.editingId();
    if (id) {
      this.coupons.update((s) =>
        s.map((c) => c.id === id ? { ...c, code, discount, discountType, value, expires: this.formExpiry() } : c),
      );
      this.toast.success('Coupon updated.');
    } else {
      const newCoupon: Coupon = {
        id: `cp${Date.now()}`,
        code, discount, discountType, value,
        uses: 0, expires: this.formExpiry(),
      };
      this.coupons.update((s) => [newCoupon, ...s]);
      this.toast.success('Coupon created.');
    }
    this.closeCouponModal();
  }

  // ============ Delete ============
  askDelete(c: Coupon): void {
    this.deleteTarget.set(c);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.coupons.update((s) => s.filter((c) => c.id !== target.id));
    this.toast.success(`Coupon ${target.code} deleted.`);
    this.deleteTarget.set(null);
  }
}
