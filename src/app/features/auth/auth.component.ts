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
  readonly confirmPassword = signal('');
  readonly registrationMessage = signal('');
  readonly registrationSuccess = signal(false);

  setTab(t: 'signin' | 'signup'): void {
    this.tab.set(t);
    this.registrationMessage.set('');
    this.registrationSuccess.set(false);
  }

  googleSignIn(): void {
    this.toastService.info('Google sign-in coming soon.');
  }

  handleSubmit(): void {
    const emailVal = this.email().trim();
    const passVal = this.password().trim();
    const nameVal = this.name().trim();
    const confirmPassVal = this.confirmPassword().trim();

    if (!emailVal || !passVal) {
      this.toastService.error('Please enter your email and password.');
      return;
    }

    if (this.tab() === 'signup') {
      if (!nameVal) {
        this.toastService.error('Please enter your full name.');
        return;
      }
      if (passVal !== confirmPassVal) {
        this.toastService.error('Passwords do not match.');
        return;
      }

      this.auth.register(nameVal, emailVal, passVal).subscribe((result) => {
        console.log('Registration API result', result);

        if (!result.ok) {
          const errorMessage = result.message ?? result.error ?? 'Registration failed.';
          this.toastService.error(errorMessage);
          this.registrationMessage.set(errorMessage);
          return;
        }

        const successMessage = result.message ?? 'Registration successful. Please check your email to confirm your account.';
        this.registrationMessage.set(successMessage);
        this.registrationSuccess.set(true);
        this.name.set('');
        this.email.set('');
        this.password.set('');
        this.confirmPassword.set('');
      });
      return;
    }

    this.auth.login(emailVal, passVal).subscribe((result) => {
      console.log('Login API result', result);

      if (!result.ok) {
        const errorMessage = result.message ?? result.error ?? `Login request failed with status ${result.error ?? 'unknown'}`;
        this.toastService.error(errorMessage);
        return;
      }

      this.toastService.success(result.message ?? 'Login successful.');
      this.router.navigate([this.auth.resolvePostLoginRoute()]);
    });
  }
}
