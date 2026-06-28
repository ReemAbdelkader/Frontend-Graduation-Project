import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import {
  AdminApiService,
  extractAdminApiError,
  OrderStatus,
  RecentOrderDto,
  AdminOrderItemDto,
} from '../../../core/services/admin-api.service';
import { PrinterService, PrinterProfileDto } from '../../../core/services/printer.service';
import { API_ORIGIN } from '../../../core/services/api-config';

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
  private printerService = inject(PrinterService);

  readonly orders = signal<RecentOrderDto[]>([]);
  readonly printers = signal<PrinterProfileDto[]>([]);
  readonly expandedOrderId = signal<string | null>(null);
  readonly query = signal('');
  readonly statusFilter = signal<StatusFilter>('All');
  readonly loading = signal(true);
  readonly savingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly apiOrigin = API_ORIGIN;

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
    this.loadPrinters();
  }

  loadPrinters(): void {
    this.printerService.getPrinterProfiles(1, 100).subscribe({
      next: (res) => {
        this.printers.set(res.data?.filter((p) => p.isActive !== false) ?? []);
      },
      error: (err) => {
        console.error('Failed to load printers', err);
      }
    });
  }

  toggleOrderDetails(orderId: string): void {
    this.expandedOrderId.update((id) => (id === orderId ? null : orderId));
  }

  onAssignPrinter(orderItemId: string, printerProfileId: string, order: RecentOrderDto): void {
    const printer = this.printers().find(p => p.id === printerProfileId);
    const printerName = printer?.printerName || 'Printer';

    this.adminApi.assignPrinterToOrderItem(orderItemId, printerProfileId).subscribe({
      next: () => {
        // update the local state of order items
        this.orders.update((list) =>
          list.map((o) => {
            if (o.id === order.id && o.orderItems) {
              const updatedItems = o.orderItems.map((item) =>
                item.id === orderItemId
                  ? { ...item, printerProfileId, printerName, status: 'AssignedToPrinter' }
                  : item
              );
              return { ...o, orderItems: updatedItems };
            }
            return o;
          })
        );
        this.toast.success(`Assigned item to ${printerName}`);
      },
      error: (err) => {
        this.toast.error(this.extractError(err, 'Failed to assign printer.'));
      }
    });
  }

  resolveImg(url: string): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('assets/')) return url;
    return `${this.apiOrigin}/${url.replace(/^\//, '')}`;
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
