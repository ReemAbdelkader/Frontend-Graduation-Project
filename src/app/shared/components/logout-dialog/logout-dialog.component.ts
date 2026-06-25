import { Component, EventEmitter, Input, Output, SimpleChanges, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LogoutScope } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-logout-dialog',
  standalone: true,
  templateUrl: './logout-dialog.component.html',
  styleUrl: './logout-dialog.component.scss',
})
export class LogoutDialogComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  readonly logoutScope = signal<LogoutScope>('current-device');
  readonly isLoggingOut = signal(false);

  readonly logoutOptions: Array<{ value: LogoutScope; label: string }> = [
    { value: 'current-device', label: 'This device only' },
    { value: 'all-devices', label: 'All devices' },
  ];

  get logoutDescription(): string {
    return this.logoutScope() === 'current-device'
      ? 'Only this device will be signed out. Other devices will remain logged in.'
      : 'You will be signed out from all devices and sessions. You may need to log in again on every device.';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.logoutScope.set('current-device');
      this.isLoggingOut.set(false);
    }
  }

  close(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.logoutScope.set('current-device');
    this.isLoggingOut.set(false);
    this.closed.emit();
  }

  submitLogout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);

    this.auth.logout(this.logoutScope()).subscribe({
      next: (result) => {
        this.isLoggingOut.set(false);

        if (result.ok) {
          this.closed.emit();
          this.toast.success(result.message ?? (this.logoutScope() === 'current-device' ? 'Signed out successfully.' : 'Signed out from all devices successfully.'));
          this.router.navigate(['/auth']);
          return;
        }

        this.toast.error(result.message ?? result.error ?? 'Logout failed.');
      },
      error: () => {
        this.isLoggingOut.set(false);
        this.toast.error('Logout failed.');
      },
    });
  }
}
