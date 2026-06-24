import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly logo = logoImage;
  readonly email = signal('');
  readonly error = signal('');
  readonly loading = signal(false);

  setEmail(v: string): void {
    this.email.set(v);
    this.error.set('');
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

    // Standalone mode: accept ANY valid email and redirect to reset-password.
    // Your team will later replace this with a real API call to
    // POST /api/Identity/forget-password which checks if the email exists.
    setTimeout(() => {
      this.loading.set(false);
      this.toast.success('Reset link sent. Check your inbox.');
      this.router.navigate(['/reset-password'], { queryParams: { email: e } });
    }, 500);
  }
}
