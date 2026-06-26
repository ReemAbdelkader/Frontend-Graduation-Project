import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-confirm-mail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './confirm-mail.component.html',
  styleUrl: './confirm-mail.component.scss',
})
export class ConfirmMailComponent implements OnInit {
  readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly message = signal('');
  readonly userId = signal('');
  readonly token = signal('');

  ngOnInit(): void {
    console.log('ConfirmMail component loaded');

    const userId = this.route.snapshot.queryParamMap.get('userId') ?? this.route.snapshot.queryParamMap.get('id') ?? this.route.snapshot.queryParamMap.get('userID') ?? '';
    const token = this.route.snapshot.queryParamMap.get('token') ?? this.route.snapshot.queryParamMap.get('confirmationToken') ?? this.route.snapshot.queryParamMap.get('authToken') ?? '';

    console.log('userId', userId);
    console.log('token', token);

    this.userId.set(userId);
    this.token.set(token);

    if (userId && token) {
      console.log('Confirm email token from URL', token);
      console.log('Confirm email token sent from Angular', token);
      console.log('Token from URL matches token sent from Angular?', token === token);
      this.confirmEmail(userId, token);
    } else {
      this.status.set('success');
      this.message.set('Thank you for registering. Check your email to confirm your account.');
    }
  }

  confirmEmail(userId: string, token: string): void {
    if (!userId || !token) {
      this.status.set('idle');
      this.message.set('');
      return;
    }

    console.log('userId', userId);
    console.log('token', token);

    console.log('Calling confirm email API');

    this.status.set('loading');
    this.message.set('We are verifying your email confirmation link…');

    this.auth.confirmEmail(userId, token).subscribe({
      next: (result) => {
        if (!result.ok) {
          console.log('confirm error', result);
          this.status.set('error');
          this.message.set(result.message ?? result.error ?? 'Email confirmation failed.');
          this.toast.error(result.message ?? result.error ?? 'Email confirmation failed.');
          return;
        }

        console.log('confirm success', result);
        this.status.set('success');
        this.message.set(result.message ?? 'Email confirmed successfully.');
        this.toast.success(result.message ?? 'Email confirmed successfully.');
      },
      error: (error) => {
        console.log('confirm error', error);
        this.status.set('error');
        const errorMessage = typeof error?.error === 'string' ? error.error : error?.message ?? 'Email confirmation failed.';
        this.message.set(errorMessage);
        this.toast.error(errorMessage);
      },
    });
  }
}
