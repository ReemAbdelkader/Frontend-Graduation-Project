import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { authImage, logoImage } from '../../core/data/wearly-data';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  private auth = inject(AuthService);
  readonly toastService = inject(ToastService);
  private router = inject(Router);

  readonly authImg = authImage;
  readonly logo = logoImage;

  readonly tab = signal<'signin' | 'signup'>('signin');
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');

  setTab(t: 'signin' | 'signup'): void {
    this.tab.set(t);
  }

  handleSubmit(): void {
    const emailVal = this.email().trim();
    const passVal = this.password().trim();
    const nameVal = this.name().trim();

    if (!emailVal || !passVal) {
      this.toastService.error('Please enter your email and password.');
      return;
    }

    if (this.tab() === 'signup') {
      const result = this.auth.register(nameVal, emailVal, passVal);
      if (!result.ok) {
        this.toastService.error(result.error ?? 'Registration failed.');
        return;
      }
      this.toastService.success('Welcome to Wearly! Let\'s set up your style profile.');
      // After register → go straight to onboarding (no separate login step)
      this.router.navigate(['/onboarding']);
      return;
    }

    // Sign-in flow
    const result = this.auth.login(emailVal, passVal);
    if (!result.ok || !result.user) {
      this.toastService.error(result.error ?? 'Login failed.');
      return;
    }
    this.toastService.success(
      `Welcome${result.user.role === 'admin' ? ' back, Admin' : ''}!`,
    );
    this.router.navigate([this.auth.resolvePostLoginRoute()]);
  }
}
