import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import {
  AdminApiService,
  extractAdminApiError,
  OrderStatus,
  RecentOrderDto,
} from '../../../core/services/admin-api.service';

type StatusFilter = OrderStatus | 'All';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private toast = inject(ToastService);
  private adminApi = inject(AdminApiService);

  readonly orders = signal<RecentOrderDto[]>([]);
  readonly query = signal('');
  readonly statusFilter = signal<StatusFilter>('All');
  readonly loading = signal(true);
  readonly savingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly statuses: StatusFilter[] = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
  readonly updatableStatuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = this.orders();
    if (!q) return list;
    return list.filter((o) =>
      `${o.orderNumber} ${o.customerName} ${o.status}`.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    const status = this.statusFilter();
    this.adminApi.getAllOrders(1, 100, status === 'All' ? undefined : status, this.query() || undefined).subscribe({
      next: (result) => {
        this.orders.set(result.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.extractError(err, 'Unable to load orders.'));
        this.loading.set(false);
      },
    });
  }

  setQuery(v: string): void {
    this.query.set(v);
  }

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.loadOrders();
  }

  onStatusChange(order: RecentOrderDto, newStatus: OrderStatus): void {
    if (newStatus === order.status) return;

    this.savingId.set(order.id);
    this.adminApi.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        this.orders.update((list) =>
          list.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
        );
        this.toast.success(`Order ${order.orderNumber} updated to ${newStatus}`);
        this.savingId.set(null);
      },
      error: (err) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)),
        );
        this.toast.error(this.extractError(err, 'Status update failed.'));
        this.savingId.set(null);
      },
    });
  }

  formatCurrency(n: number): string {
    return '$' + (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  statusClass(status: string): string {
    return 'status-' + (status || 'pending').toLowerCase();
  }

  private extractError(error: unknown, fallback: string): string {
    return extractAdminApiError(error, fallback);
  }
}
