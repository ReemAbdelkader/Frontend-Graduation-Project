import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { mockOrders, MockOrder } from '../../../core/data/admin-mock-data';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  readonly orders = signal<MockOrder[]>(mockOrders);
  readonly query = signal('');
  readonly statusFilter = signal<string>('All');

  readonly statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const sf = this.statusFilter();
    return this.orders().filter((o) => {
      const matchesQ = !q || `${o.orderNumber} ${o.customerName}`.toLowerCase().includes(q);
      const matchesStatus = sf === 'All' || o.status === sf;
      return matchesQ && matchesStatus;
    });
  });

  setQuery(v: string): void { this.query.set(v); }
  setStatusFilter(v: string): void { this.statusFilter.set(v); }

  /** Inline status dropdown change — updates local list. */
  onStatusChange(order: MockOrder, newStatus: MockOrder['status']): void {
    this.orders.update((s) =>
      s.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
    );
  }

  formatCurrency(n: number): string {
    return '$' + (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}
