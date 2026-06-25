import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { logoImage } from '../../core/data/wearly-data';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private resendTimer: number | null = null;

  readonly logo = logoImage;
  readonly email = signal('');
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly loading = signal(false);
  readonly requestSent = signal(false);
  readonly canResend = signal(false);
  readonly resendCountdown = signal(60);

  setEmail(v: string): void {
    this.email.set(v);
    this.error.set('');
    if (!this.requestSent()) {
      this.successMessage.set('');
    }
  }

  submit(): void {
    const e = this.email().trim().toLowerCase();
    if (!e) {
      this.error.set('Email is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      this.error.set('Please enter a valid email address.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    this.auth.forgotPassword(e).subscribe((result) => {
      this.loading.set(false);

      if (!result.ok) {
        const errorMessage = result.message ?? result.error ?? 'Unable to send the reset link. Please try again.';
        this.error.set(errorMessage);
        this.toast.error(errorMessage);
        return;
      }

      const successMessage = result.message ?? 'Password reset link has been sent to your email.';
      this.successMessage.set(successMessage);
      this.requestSent.set(true);
      this.canResend.set(false);
      this.resendCountdown.set(60);
      this.toast.success(successMessage);
      this.startResendCountdown();
    });
  }

  resendEmail(): void {
    if (!this.canResend()) {
      return;
    }

    const e = this.email().trim().toLowerCase();
    if (!e) {
      this.error.set('Email is required.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.forgotPassword(e).subscribe((result) => {
      this.loading.set(false);

      if (!result.ok) {
        const errorMessage = result.message ?? result.error ?? 'Unable to send the reset link. Please try again.';
        this.error.set(errorMessage);
        this.toast.error(errorMessage);
        return;
      }

      const successMessage = result.message ?? 'Password reset link has been sent to your email.';
      this.successMessage.set(successMessage);
      this.canResend.set(false);
      this.resendCountdown.set(60);
      this.toast.success(successMessage);
      this.startResendCountdown();
    });
  }

  private startResendCountdown(): void {
    if (this.resendTimer) {
      window.clearInterval(this.resendTimer);
    }

    this.canResend.set(false);
    this.resendCountdown.set(60);

    this.resendTimer = window.setInterval(() => {
      this.resendCountdown.update((value) => {
        if (value <= 1) {
          if (this.resendTimer) {
            window.clearInterval(this.resendTimer);
            this.resendTimer = null;
          }
          this.canResend.set(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.resendTimer) {
      window.clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
