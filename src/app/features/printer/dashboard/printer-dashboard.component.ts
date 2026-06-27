import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PrinterOrder, mockPrinterOrders } from '../../printer/printer-mock-data';

@Component({
  selector: 'app-printer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './printer-dashboard.component.html',
  styleUrl: './printer-dashboard.component.scss',
})
export class PrinterDashboardComponent {
  readonly orders = signal<PrinterOrder[]>(mockPrinterOrders);

  readonly totalOrders = computed(() => this.orders().length);
  readonly pendingOrders = computed(() => this.orders().filter((o) => o.status === 'Pending').length);
  readonly printingOrders = computed(() => this.orders().filter((o) => o.status === 'Printing').length);
  readonly completedOrders = computed(() => this.orders().filter((o) => o.status === 'Completed').length);
}
