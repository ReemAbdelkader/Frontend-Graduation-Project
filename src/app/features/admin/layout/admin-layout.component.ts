import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { logoImage } from '../../../core/data/wearly-data';

interface NavItem {
  to: string;
  label: string;
  icon: 'dashboard' | 'users' | 'creators' | 'orders' | 'categories' | 'products' | 'templates' | 'moderation' | 'rewards' | 'ai-reports' | 'settings';
  exact: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialogComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly logo = logoImage;
  readonly user = this.auth.user;
  readonly isAdmin = this.auth.isAdmin;

  readonly collapsed = signal(false);
  readonly askLogout = signal(false);

  readonly nav: NavItem[] = [
    { to: '/control-center',              label: 'Overview',    icon: 'dashboard',  exact: true },
    { to: '/control-center/users',        label: 'Users',       icon: 'users',      exact: false },
    { to: '/control-center/creators',     label: 'Creators',    icon: 'creators',   exact: false },
    { to: '/control-center/orders',       label: 'Orders',      icon: 'orders',     exact: false },
    { to: '/control-center/categories',   label: 'Categories',  icon: 'categories', exact: false },
    { to: '/control-center/products',     label: 'Products',    icon: 'products',   exact: false },
    { to: '/control-center/templates',    label: 'Templates',   icon: 'templates',  exact: false },
    { to: '/control-center/moderation',   label: 'Moderation',  icon: 'moderation', exact: false },
    { to: '/control-center/rewards',      label: 'Rewards',     icon: 'rewards',    exact: false },
    { to: '/control-center/ai-reports',   label: 'AI Reports',  icon: 'ai-reports', exact: false },
    { to: '/control-center/settings',     label: 'Settings',    icon: 'settings',   exact: false },
  ];

  readonly currentLabel = computed(() => {
    const url = this.router.url;
    const match = this.nav.find((n) =>
      n.exact ? url === n.to : url.startsWith(n.to),
    );
    return match?.label ?? 'Overview';
  });

  get initials(): string {
    const name = this.user()?.name ?? 'AD';
    return name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  toggleCollapse(): void {
    this.collapsed.update((c) => !c);
  }

  viewAsUser(): void {
    this.toast.success('Switched to user view');
    this.router.navigate(['/dashboard']);
  }

  openLogout(): void {
    this.askLogout.set(true);
  }

  cancelLogout(): void {
    this.askLogout.set(false);
  }

  confirmLogout(): void {
    this.askLogout.set(false);
    this.auth.logout().subscribe((result) => {
      if (result.ok) {
        this.toast.success(result.message ?? 'Signed out successfully.');
        this.router.navigate(['/auth']);
      } else {
        this.toast.error(result.message ?? result.error ?? 'Logout failed.');
      }
    });
  }
}
