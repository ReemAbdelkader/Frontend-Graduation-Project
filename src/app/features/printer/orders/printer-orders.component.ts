import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrinterService, PrinterOrderItemDto, PrinterOrderItemStatus } from '../../../core/services/printer.service';
import { ToastService } from '../../../core/services/toast.service';
import { API_ORIGIN } from '../../../core/services/api-config';

export const printerStatusOptions: PrinterOrderItemStatus[] = ['Pending', 'AssignedToPrinter', 'InProduction', 'Ready', 'Shipped'];

@Component({
  selector: 'app-printer-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './printer-orders.component.html',
  styleUrl: './printer-orders.component.scss',
})
export class PrinterOrdersComponent implements OnInit {
  private readonly printerService = inject(PrinterService);
  private readonly toast = inject(ToastService);

  readonly orders = signal<PrinterOrderItemDto[]>([]);
  readonly loading = signal(true);
  readonly statusOptions = printerStatusOptions;
  readonly updatingId = signal<string | null>(null);

  readonly apiOrigin = API_ORIGIN;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.printerService.getMyOrderItems().subscribe({
      next: (result) => {
        this.orders.set(result.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load orders.');
        this.loading.set(false);
      },
    });
  }

  updateStatus(orderItemId: string, newStatus: string): void {
    this.updatingId.set(orderItemId);

    this.printerService.updateOrderItemStatus(orderItemId, newStatus as PrinterOrderItemStatus).subscribe({
      next: (res) => {
        if (res?.succeeded) {
          this.toast.success('Status updated.');
          this.loadOrders();
        } else {
          this.toast.error(res?.message || 'Failed to update status.');
          this.loadOrders();
        }
        this.updatingId.set(null);
      },
      error: () => {
        this.toast.error('Failed to update status.');
        this.updatingId.set(null);
      },
    });
  }

  resolveImg(url: string): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('assets/')) return url;
    return `${this.apiOrigin}/${url.replace(/^\//, '')}`;
  }
}