import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { logoImage } from '../../core/data/wearly-data';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly logo = logoImage;
  readonly invitationMode = this.route.snapshot.routeConfig?.path === 'accept-invitation';
  readonly email = signal(this.route.snapshot.queryParamMap.get('email') ?? '');
  readonly userId = signal(this.route.snapshot.queryParamMap.get('userId') ?? '');
  readonly token = signal(this.route.snapshot.queryParamMap.get('token') ?? '');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showPassword = signal(false);
  readonly error = signal('');
  readonly loading = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.email.set(params.get('email') ?? '');
      this.userId.set(params.get('userId') ?? '');
      this.token.set(params.get('token') ?? '');
    });
  }

  setNewPassword(v: string): void {
    this.newPassword.set(v);
    this.error.set('');
  }

  setConfirmPassword(v: string): void {
    this.confirmPassword.set(v);
    this.error.set('');
  }

  toggleShowPassword(): void {
    this.showPassword.update((value) => !value);
  }

  submit(): void {
    const e = this.email().trim();
    const authToken = this.token().trim();
    const password = this.newPassword().trim();
    const confirmPassword = this.confirmPassword().trim();

    if (this.invitationMode && !this.userId().trim()) {
      this.error.set('Invitation user is missing.');
      return;
    }
    if (!this.invitationMode && !e) {
      this.error.set('Email is required.');
      return;
    }
    if (!authToken) {
      this.error.set('Reset token is missing.');
      return;
    }
    if (!password) {
      this.error.set('New password is required.');
      return;
    }
    if (!confirmPassword) {
      this.error.set('Please confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const request = this.invitationMode
      ? this.auth.acceptInvitation(this.userId(), authToken, password)
      : this.auth.resetPassword(e, authToken, password);

    request.subscribe((result) => {
      this.loading.set(false);

      if (!result.ok) {
        const errorMessage = result.message ?? result.error ??
          (this.invitationMode
            ? 'Unable to accept the invitation. Please request a new link.'
            : 'Unable to reset your password. Please try again.');
        this.error.set(errorMessage);
        this.toast.error(errorMessage);
        return;
      }

      const successMessage = result.message ??
        (this.invitationMode
          ? 'Invitation accepted. Please log in.'
          : 'Password reset successfully. Please log in.');
      this.toast.success(successMessage);
      window.setTimeout(() => {
        this.router.navigate(['/auth']);
      }, 2000);
    });
  }
}
