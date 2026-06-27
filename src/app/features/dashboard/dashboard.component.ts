import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import {
  products,
  dashboardActivity,
  orders,
  templates,
} from '../../core/data/wearly-data';
import { AuthService } from '../../core/services/auth.service';

interface Stat {
  label: string;
  value: string;
  delta: string;
  icon: 'bookmark' | 'package' | 'heart';
  tint: string;
}

interface QuickAccess {
  to: string;
  title: string;
  desc: string;
  icon: 'wand' | 'template' | 'users' | 'package';
}

interface DraftDesign {
  title: string;
  product: string;
  updated: string;
  image: string;
  progress: number;
  tags: string[];
}

interface ChecklistItem {
  label: string;
  complete: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, AppNavComponent, ProductCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly isAdmin = this.auth.isAdmin;

  readonly recos = products.slice(0, 4);
  readonly activity = dashboardActivity;
  readonly activeOrder = orders.find((order) => order.status !== 'DELIVERED') ?? orders[0];

  readonly featuredDraft: DraftDesign = {
    title: 'Prism Field Remix',
    product: 'Heavyweight hoodie',
    updated: 'Edited 2h ago',
    image: templates[1]?.image ?? products[0]?.image ?? '',
    progress: 72,
    tags: ['Front print placed', 'Colors selected', 'Mockup ready'],
  };

  readonly stats: Stat[] = [
    { label: 'Saved designs', value: '8', delta: '+2 this week', icon: 'bookmark', tint: 'from-primary' },
    { label: 'Active orders', value: '2', delta: '1 needs review', icon: 'package', tint: 'from-accent' },
    { label: 'Community likes', value: '1,284', delta: '+126 this week', icon: 'heart', tint: 'from-success' },
  ];

  readonly quickAccess: QuickAccess[] = [
    { to: '/studio', title: 'Start a design', desc: 'Create with AI tools', icon: 'wand' },
    { to: '/templates', title: 'Use a template', desc: 'Begin from a curated style', icon: 'template' },
    { to: '/community', title: 'Remix community work', desc: 'Find ideas from creators', icon: 'users' },
    { to: '/orders', title: 'Check production', desc: 'Track orders and history', icon: 'package' },
  ];

  readonly checklist: ChecklistItem[] = [
    { label: 'Choose a product base', complete: true },
    { label: 'Place artwork inside print zone', complete: true },
    { label: 'Preview front and back mockups', complete: false },
    { label: 'Add to cart or publish', complete: false },
  ];

  get firstName(): string {
    return (this.user()?.name ?? 'there').split(' ')[0];
  }

  get greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 18) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }

  get currentDate(): string {
    return new Intl.DateTimeFormat('en', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }
}
