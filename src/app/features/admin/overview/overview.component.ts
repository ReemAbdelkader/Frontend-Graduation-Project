import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  overviewStats,
  ordersByStatus,
  recentOrders,
  MockOrder,
} from '../../../core/data/admin-mock-data';

interface StatusSlice {
  status: string;
  count: number;
  color: string;
  percent: number;
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
})
export class OverviewComponent {
  readonly stats = overviewStats;
  readonly recentOrders: MockOrder[] = recentOrders;

  private readonly statusColors: Record<string, string> = {
    Pending: '#FF6B4A',
    Processing: '#7AA7D9',
    Shipped: '#00C9A7',
    Delivered: '#1A1A2E',
    Cancelled: '#9CA3AF',
    Returned: '#A78BFA',
  };

  readonly statusSlices = computed<StatusSlice[]>(() => {
    const slices = ordersByStatus;
    const total = slices.reduce((sum, s) => sum + s.count, 0) || 1;
    return slices.map((s) => ({
      status: s.status,
      count: s.count,
      color: this.statusColors[s.status] ?? '#9CA3AF',
      percent: Math.round((s.count / total) * 100),
    }));
  });

  readonly arcs = computed(() => {
    const slices = this.statusSlices();
    if (slices.length === 0) return [];
    let cumulative = 0;
    const total = slices.reduce((sum, s) => sum + s.count, 0) || 1;
    return slices.map((s) => {
      const startAngle = (cumulative / total) * 360;
      cumulative += s.count;
      const endAngle = (cumulative / total) * 360;
      return { ...s, d: this.describeArc(50, 50, 40, startAngle, endAngle) };
    });
  });

  readonly totalOrdersInChart = computed(() =>
    this.statusSlices().reduce((sum, s) => sum + s.count, 0),
  );

  // ============ SVG donut helpers ============
  private polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
  }

  private describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    if (endAngle - startAngle >= 360) {
      return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
    }
    const start = this.polarToCartesian(cx, cy, r, endAngle);
    const end = this.polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  formatCurrency(n: number): string {
    return '$' + (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  statusClass(status: string): string {
    return 'status-' + (status || 'pending').toLowerCase();
  }
}
