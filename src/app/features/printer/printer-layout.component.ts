import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LogoutDialogComponent } from '../../shared/components/logout-dialog/logout-dialog.component';
import { logoImage } from '../../core/data/wearly-data';

interface PrinterNavItem {
  to: string;
  label: string;
  icon: 'dashboard' | 'orders' | 'profile';
  exact: boolean;
}

@Component({
  selector: 'app-printer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoutDialogComponent],
  templateUrl: './printer-layout.component.html',
  styleUrl: './printer-layout.component.scss',
})
export class PrinterLayoutComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly logo = logoImage;
  readonly user = this.auth.user;

  readonly collapsed = signal(false);
  readonly askLogout = signal(false);

  readonly nav: PrinterNavItem[] = [
    { to: '/printer', label: 'Dashboard', icon: 'dashboard', exact: true },
    { to: '/printer/orders', label: 'Orders', icon: 'orders', exact: false },
    { to: '/printer/profile', label: 'Profile', icon: 'profile', exact: false },
  ];

  readonly currentLabel = computed(() => {
    const url = this.router.url;
    const match = this.nav.find((n) => (n.exact ? url === n.to : url.startsWith(n.to)));
    return match?.label ?? 'Dashboard';
  });

  readonly isPrinter = computed(() => this.user()?.roles.some((role) => role.toLowerCase() === 'printer') ?? false);

  get initials(): string {
    const name = this.user()?.name ?? 'PR';
    return name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  toggleCollapse(): void {
    this.collapsed.update((c) => !c);
  }

  openLogout(): void {
    this.askLogout.set(true);
  }

  switchToUserView(): void {
    this.router.navigate(['/dashboard']);
  }

  cancelLogout(): void {
    this.askLogout.set(false);
  }

  goHome(): void {
    this.router.navigate(['/printer']);
  }
}
