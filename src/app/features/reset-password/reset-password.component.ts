import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly logo = logoImage;

  // Pre-fill the email from the query string if coming from /forgot-password.
  readonly email = signal(this.route.snapshot.queryParamMap.get('email') ?? '');
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly error = signal('');
  readonly loading = signal(false);

  setEmail(v: string): void {
    this.email.set(v);
    this.error.set('');
  }

  setPassword(v: string): void {
    this.password.set(v);
    this.error.set('');
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    const e = this.email().trim();
    const p = this.password().trim();

    if (!e) {
      this.error.set('Email is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      this.error.set('Please enter a valid email address.');
      return;
    }
    if (p.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }

    this.loading.set(true);

    // Mock reset — your team will swap for a real API call.
    setTimeout(() => {
      this.loading.set(false);
      this.toast.success('Password reset successfully. Please log in.');
      this.router.navigate(['/auth']);
    }, 600);
  }
}
