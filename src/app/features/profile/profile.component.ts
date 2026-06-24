import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

type ProfileTab = 'posts' | 'marketplace' | 'rewards' | 'settings';

interface Metric {
  icon: 'shopping' | 'store' | 'dollar' | 'layers' | 'star' | 'crown';
  label: string;
  value: string;
  sub?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, AppNavComponent, ConfirmDialogComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly user = this.auth.user();

  readonly tab = signal<ProfileTab>('settings');

  // Editable form fields (pre-filled from current user)
  readonly formName = signal(this.user?.name ?? '');
  readonly formUsername = signal((this.user?.email ?? '').split('@')[0]);
  readonly formEmail = signal(this.user?.email ?? '');
  readonly formBio = signal("Designing quiet, sculptural pieces from Lisbon. SS '26 atelier drop now live.");
  readonly formNewPassword = signal('');

  readonly askLogout = signal(false);

  readonly metrics: Metric[] = [
    { icon: 'shopping', label: 'Items purchased', value: '38', sub: 'from 12 sellers' },
    { icon: 'store', label: 'Total orders', value: '24' },
    { icon: 'dollar', label: 'Total spent', value: '$4,218' },
    { icon: 'layers', label: 'Templates created', value: '9' },
    { icon: 'star', label: 'Avg. template rating', value: '4.82', sub: 'from other users' },
    { icon: 'crown', label: 'Top profile', value: 'Yes', sub: 'High-rated templates' },
  ];

  readonly tabs: Array<{ key: ProfileTab; label: string; hasIcon: boolean }> = [
    { key: 'posts', label: 'Community posts', hasIcon: false },
    { key: 'marketplace', label: 'Marketplace', hasIcon: false },
    { key: 'rewards', label: 'Rewards', hasIcon: false },
    { key: 'settings', label: 'Settings', hasIcon: true },
  ];

  setTab(t: ProfileTab): void {
    this.tab.set(t);
  }

  get initials(): string {
    const name = this.user?.name ?? 'EA';
    return name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  get joinDate(): string {
    return 'January 2026';
  }

  get username(): string {
    return (this.user?.email ?? 'user').split('@')[0];
  }

  saveChanges(): void {
    const name = this.formName().trim();
    const email = this.formEmail().trim();
    const username = this.formUsername().trim();

    if (!name || !username || !email) {
      this.toast.error('Name, username and email are required.');
      return;
    }

    this.toast.success('Profile updated successfully.');
  }

  openLogout(): void {
    this.askLogout.set(true);
  }

  cancelLogout(): void {
    this.askLogout.set(false);
  }

  confirmLogout(): void {
    this.askLogout.set(false);
    this.auth.logout();
    this.toast.success('Signed out');
    this.router.navigate(['/auth']);
  }
}
