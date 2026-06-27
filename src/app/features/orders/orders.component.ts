import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { OrderDto } from '../../core/models/shop.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterLink, AppNavComponent, CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly orders = signal<OrderDto[]>([]);
  readonly loading = signal(true);
  readonly cancellingOrderId = signal<string | null>(null);
  readonly showPaymentBanner = signal(false);
  readonly highlightedOrderId = signal<string | null>(null);

  readonly stages = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

  ngOnInit(): void {
    const fromCheckout = this.route.snapshot.queryParamMap.get('fromCheckout') === 'true';
    if (fromCheckout) {
      this.showPaymentBanner.set(true);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { fromCheckout: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    this.loadOrders(fromCheckout);
  }

  loadOrders(highlightNewest = false): void {
    const uid = this.authService.userId();
    if (!uid) {
      this.toast.error('Please log in to view your orders.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.orderService.getUserOrders(uid).subscribe({
      next: (data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.placedDate).getTime() - new Date(a.placedDate).getTime()
        );
        this.orders.set(sorted);
        this.loading.set(false);

        if (highlightNewest && sorted.length > 0) {
          this.highlightedOrderId.set(sorted[0].orderId);
          setTimeout(() => this.scrollToOrder(sorted[0].orderId), 100);
        }
      },
      error: () => {
        this.toast.error('Failed to load orders.');
        this.loading.set(false);
      },
    });
  }

  get activeCount(): number {
    return this.orders().length;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Shipped': return 'status-shipped';
      case 'Delivered': return 'status-delivered';
      case 'Processing': return 'status-processing';
      case 'Cancelled': return 'status-cancelled';
      case 'Returned': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getTimelineIndex(status: string): number {
    switch (status) {
      case 'Pending': return 0;
      case 'Processing': return 1;
      case 'Shipped': return 2;
      case 'Delivered': return 4;
      default: return 0;
    }
  }

  progressWidth(status: string): string {
    const idx = this.getTimelineIndex(status);
    return `${(idx / (this.stages.length - 1)) * 90}%`;
  }

  isDone(i: number, status: string): boolean {
    return i <= this.getTimelineIndex(status);
  }

  isCurrent(i: number, status: string): boolean {
    return i === this.getTimelineIndex(status);
  }

  isCancellable(status: string): boolean {
    return status !== 'Shipped' && status !== 'Delivered' && status !== 'Cancelled' && status !== 'Returned';
  }

  cancelOrder(orderId: string): void {
    if (this.cancellingOrderId()) return;
    this.cancellingOrderId.set(orderId);

    this.orderService.cancelOrder(orderId).subscribe({
      next: (success) => {
        if (success) {
          this.toast.success('Order cancelled successfully.');
          this.loadOrders();
        } else {
          this.toast.error('Could not cancel this order. It may have already been shipped.');
        }
        this.cancellingOrderId.set(null);
      },
      error: () => {
        this.toast.error('Failed to cancel order. Please try again.');
        this.cancellingOrderId.set(null);
      },
    });
  }

  formatPrice(n: number): string {
    return n.toFixed(2);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  trackOrder(trackingNumber: string): void {
    if (!trackingNumber) {
      this.toast.info('Tracking number is not available yet.');
      return;
    }

    navigator.clipboard?.writeText(trackingNumber).then(() => {
      this.toast.success(`Tracking number copied: ${trackingNumber}`);
    }).catch(() => {
      this.toast.info(`Tracking number: ${trackingNumber}`);
    });
  }

  dismissPaymentBanner(): void {
    this.showPaymentBanner.set(false);
    this.highlightedOrderId.set(null);
  }

  private scrollToOrder(orderId: string): void {
    const el = document.getElementById(`order-${orderId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}