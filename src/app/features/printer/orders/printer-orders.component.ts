import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrinterOrder, mockPrinterOrders, orderStatusOptions } from '../../printer/printer-mock-data';

@Component({
  selector: 'app-printer-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './printer-orders.component.html',
  styleUrl: './printer-orders.component.scss',
})
export class PrinterOrdersComponent {
  readonly orders = signal<PrinterOrder[]>([...mockPrinterOrders]);
  readonly statusOptions = orderStatusOptions;

  updateStatus(orderId: string, newStatus: string): void {
    this.orders.update((list) =>
      list.map((order) =>
        order.id === orderId ? { ...order, status: newStatus as PrinterOrder['status'] } : order,
      ),
    );
  }
}
