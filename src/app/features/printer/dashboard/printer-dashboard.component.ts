import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PrinterDashboardStats, PrinterService } from '../../../core/services/printer.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-printer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './printer-dashboard.component.html',
  styleUrl: './printer-dashboard.component.scss',
})
export class PrinterDashboardComponent implements OnInit {
  private readonly printerService = inject(PrinterService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly stats = signal<PrinterDashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    printingOrders: 0,
    completedOrders: 0,
  });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);

    this.printerService.getProfileSummary().subscribe({
      next: (summary) => {
        if (summary) {
          this.stats.set(summary);
          this.loading.set(false);
          return;
        }

        this.loadStatsFromOrders();
      },
      error: () => {
        this.loadStatsFromOrders();
      },
    });
  }

  private loadStatsFromOrders(): void {
    this.printerService.getMyOrderItems(1, 200).subscribe({
      next: (result) => {
        const orders = result.data ?? [];
        this.stats.set({
          totalOrders: orders.length,
          pendingOrders: orders.filter((order) =>
            order.status === 'Pending' || order.status === 'AssignedToPrinter',
          ).length,
          printingOrders: orders.filter((order) => order.status === 'InProduction').length,
          completedOrders: orders.filter((order) =>
            order.status === 'Ready' || order.status === 'Shipped',
          ).length,
        });
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load dashboard stats.');
        this.loading.set(false);
      },
    });
  }
}
