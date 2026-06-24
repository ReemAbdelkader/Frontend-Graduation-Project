import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { orders, Order } from '../../core/data/wearly-data';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterLink, AppNavComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  readonly orders = orders;
  readonly stages = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

  get activeCount(): number {
    return this.orders.length;
  }

  statusClass(status: Order['status']): string {
    switch (status) {
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'PROCESSING': return 'status-processing';
      default: return '';
    }
  }

  progressWidth(timeline: number): string {
    return `${(timeline / (this.stages.length - 1)) * 90}%`;
  }

  isDone(i: number, timeline: number): boolean {
    return i <= timeline;
  }

  isCurrent(i: number, timeline: number): boolean {
    return i === timeline;
  }

  itemTotal(price: number, qty: number): number {
    return price * qty;
  }

  formatPrice(n: number): string {
    return n.toFixed(2);
  }
}
