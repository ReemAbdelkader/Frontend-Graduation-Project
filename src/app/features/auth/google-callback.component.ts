import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, AuthState } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  template: '',
})
export class GoogleCallbackComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const id = params.get('id')?.trim();
    const email = params.get('email')?.trim();
    const accessToken = params.get('accessToken')?.trim();
    const refreshToken = params.get('refreshToken')?.trim();
    const expiresAt = params.get('expiresAt')?.trim() ?? '';
    const name = params.get('name')?.trim() ?? email ?? '';
    const rolesParam = params.get('roles')?.trim() ?? 'user';
    const onboardingCompleted = params.get('onboardingCompleted')?.trim() === 'true';

    if (!accessToken || !refreshToken) {
      this.toast.error('Google sign-in could not be completed. Please try again.');
      this.router.navigate(['/auth']);
      return;
    }

    const roles = rolesParam
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);

    const state: AuthState = {
      accessToken,
      refreshToken,
      expiresAt,
      email: email ?? '',
      name: name || email || 'Google User',
      roles: roles.length ? roles : ['user'],
      onboardingCompleted,
    };

    this.auth.completeExternalLogin(state);
    this.toast.success('Signed in successfully with Google.');
    this.router.navigateByUrl(this.auth.resolvePostLoginRoute(), { replaceUrl: true });
  }
}
