import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import {
  products,
  dashboardActivity,
} from '../../core/data/wearly-data';
import { AuthService } from '../../core/services/auth.service';

interface Stat {
  label: string;
  value: string;
  delta: string;
  icon: 'bookmark' | 'package' | 'heart' | 'trending';
  tint: string;
}

interface QuickAccess {
  to: string;
  title: string;
  desc: string;
  icon: 'wand' | 'template' | 'users' | 'package';
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

  readonly stats: Stat[] = [
    { label: 'Saved designs', value: '24', delta: '+3 this week', icon: 'bookmark', tint: 'from-primary' },
    { label: 'Active orders', value: '2', delta: '1 shipped', icon: 'package', tint: 'from-accent' },
    { label: 'Community likes', value: '1,284', delta: '+126 this week', icon: 'heart', tint: 'from-success' },
    { label: 'Style match', value: '92%', delta: 'Tuned', icon: 'trending', tint: 'mixed' },
  ];

  readonly quickAccess: QuickAccess[] = [
    { to: '/studio', title: 'AI Designer', desc: 'Prompt to garment', icon: 'wand' },
    { to: '/templates', title: 'Templates', desc: 'Curated drops', icon: 'template' },
    { to: '/community', title: 'Community', desc: 'Browse & remix', icon: 'users' },
    { to: '/orders', title: 'Orders', desc: 'Track & history', icon: 'package' },
  ];

  get firstName(): string {
    return (this.user()?.name ?? 'there').split(' ')[0];
  }

  get currentDate(): string {
    return 'Tuesday · June 2';
  }
}
