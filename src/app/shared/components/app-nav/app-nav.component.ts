import { Component, inject, signal } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationBellComponent } from '../notifications/notifications.component';
import { LogoutDialogComponent } from '../logout-dialog/logout-dialog.component';
import { logoImage } from '../../../core/data/wearly-data';

interface NavLink {
  to: string;
  label: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotificationBellComponent, LogoutDialogComponent, NgIf, NgForOf],
  templateUrl: './app-nav.component.html',
  styleUrl: './app-nav.component.scss',
})
export class AppNavComponent {
  private auth = inject(AuthService);

  readonly logo = logoImage;

  readonly user = this.auth.user;
  readonly isAdmin = this.auth.isAdmin;

  readonly askLogout = signal(false);

  readonly allLinks: NavLink[] = [
    { to: '/dashboard', label: 'Dashboard', adminOnly: false },
    { to: '/shop', label: 'Shop', adminOnly: false },
    { to: '/studio', label: 'Design Studio', adminOnly: false },
    { to: '/templates', label: 'Templates', adminOnly: false },
    { to: '/community', label: 'Community', adminOnly: false },
    { to: '/orders', label: 'My Orders', adminOnly: false },
  ];

  get links(): NavLink[] {
    return this.allLinks;
  }

  get initials(): string {
    const name = this.user()?.name ?? 'EA';
    return name
      .split(' ')
      .map((p: string) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  openLogout(): void {
    this.askLogout.set(true);
  }

  closeLogout(): void {
    this.askLogout.set(false);
  }
}
