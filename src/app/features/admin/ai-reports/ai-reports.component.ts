import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminApiService,
  AiReportDto,
  AiReportType,
  extractAdminApiError,
} from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';

interface ReportCategory {
  key: AiReportType;
  icon: 'bar' | 'package' | 'users' | 'layers' | 'factory' | 'message';
}

interface MetricCard {
  label: string;
  value: string;
}

interface BreakdownRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-admin-ai-reports',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-reports.component.html',
  styleUrl: './ai-reports.component.scss',
})
export class AiReportsComponent {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly numberFormatter = new Intl.NumberFormat('en-US');
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

  readonly categories: ReportCategory[] = [
    { key: 'Revenue', icon: 'bar' },
    { key: 'Orders', icon: 'package' },
    { key: 'Creators', icon: 'users' },
    { key: 'Products', icon: 'package' },
    { key: 'Templates', icon: 'layers' },
    { key: 'Production', icon: 'factory' },
    { key: 'Community', icon: 'message' },
  ];

  readonly selectedType = signal<AiReportType>('Revenue');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly report = signal<AiReportDto | null>(null);
  readonly generating = signal(false);

  setFromDate(value: string): void {
    this.fromDate.set(value);
  }

  setToDate(value: string): void {
    this.toDate.set(value);
  }

  generate(reportType = this.selectedType()): void {
    if (this.generating()) return;

    if (this.fromDate() && this.toDate() && this.fromDate() > this.toDate()) {
      this.toast.error('The start date must be on or before the end date.');
      return;
    }

    this.selectedType.set(reportType);
    this.generating.set(true);

    this.adminApi.generateAiReport(reportType, {
      fromDate: this.fromDate() || null,
      toDate: this.toDate() || null,
    }).subscribe({
      next: (report) => {
        this.report.set(report);
        this.generating.set(false);
      },
      error: (error) => {
        this.generating.set(false);
        this.toast.error(extractAdminApiError(error, 'Report generation failed.'));
      },
    });
  }

  metricCards(report: AiReportDto): MetricCard[] {
    const metrics = report.metrics;
    switch (metrics.metricType) {
      case 'orders':
        return [
          this.numberCard('Total orders', metrics.totalOrders),
          this.currencyCard('Order value', metrics.totalOrderValue),
          this.currencyCard('Average order', metrics.averageOrderValue),
          this.numberCard('Units ordered', metrics.totalItems),
        ];
      case 'revenue':
        return [
          this.currencyCard('Total revenue', metrics.totalRevenue),
          this.currencyCard('Gross subtotal', metrics.grossSubtotal),
          this.currencyCard('Discounts', metrics.totalDiscounts),
          this.currencyCard('Average order', metrics.averageOrderValue),
          this.numberCard('Revenue orders', metrics.revenueGeneratingOrders),
        ];
      case 'creators':
        return [
          this.numberCard('Active creators', metrics.activeCreators),
          this.numberCard('Public templates', metrics.publicTemplates),
          this.numberCard('Template likes', metrics.totalLikes),
          this.numberCard('Template remixes', metrics.totalRemixes),
        ];
      case 'products':
        return [
          this.numberCard('Products', metrics.totalProducts),
          this.numberCard('Available', metrics.availableProducts),
          this.numberCard('Unavailable', metrics.unavailableProducts),
          this.currencyCard('Average price', metrics.averageBasePrice),
          { label: 'Average rating', value: metrics.averageRating.toFixed(1) },
        ];
      case 'templates':
        return [
          this.numberCard('Templates', metrics.totalTemplates),
          this.numberCard('Public', metrics.publicTemplates),
          this.numberCard('Private', metrics.privateTemplates),
          this.numberCard('Likes', metrics.totalLikes),
          this.numberCard('Remixes', metrics.totalRemixes),
        ];
      case 'production':
        return [
          this.numberCard('Order items', metrics.totalOrderItems),
          this.numberCard('Units', metrics.totalUnits),
          this.numberCard('Assigned', metrics.assignedItems),
          this.numberCard('Unassigned', metrics.unassignedItems),
          this.numberCard('Active printers', metrics.activePrinters),
        ];
      case 'community':
        return [
          this.numberCard('Interactions', metrics.totalInteractions),
          this.numberCard('Likes', metrics.likes),
          this.numberCard('Saves', metrics.saves),
          this.numberCard('Remixes', metrics.remixes),
          this.numberCard('Comments', metrics.comments),
        ];
    }
  }

  breakdownRows(report: AiReportDto): BreakdownRow[] {
    const metrics = report.metrics;
    if (metrics.metricType === 'orders') {
      return metrics.ordersByStatus.map(item => ({
        label: item.name,
        value: this.numberFormatter.format(item.count),
      }));
    }

    if (metrics.metricType === 'production') {
      return metrics.itemsByStatus.map(item => ({
        label: item.name,
        value: this.numberFormatter.format(item.count),
      }));
    }

    if (metrics.metricType === 'creators') {
      return metrics.topCreators.map(creator => ({
        label: creator.userName,
        value: `${this.numberFormatter.format(creator.templateCount)} templates · ${this.numberFormatter.format(creator.totalLikes)} likes · ${this.numberFormatter.format(creator.totalRemixes)} remixes`,
      }));
    }

    return [];
  }

  generatedLabel(value: string): string {
    return new Date(value).toLocaleString();
  }

  dateRangeLabel(report: AiReportDto): string {
    const from = report.filters?.fromDate;
    const to = report.filters?.toDate;
    if (!from && !to) return 'All-time data';
    if (from && to) return `${this.shortDate(from)} – ${this.shortDate(to)}`;
    if (from) return `From ${this.shortDate(from)}`;
    return `Through ${this.shortDate(to!)}`;
  }

  private shortDate(value: string): string {
    return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString();
  }

  private numberCard(label: string, value: number): MetricCard {
    return { label, value: this.numberFormatter.format(value) };
  }

  private currencyCard(label: string, value: number): MetricCard {
    return { label, value: this.currencyFormatter.format(value) };
  }
}
