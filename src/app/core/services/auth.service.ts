import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole = 'user' | 'admin';
export type LogoutScope = 'current-device' | 'all-devices';

export interface WearlyUser {
  name: string;
  email: string;
  roles: string[];
}

export interface AuthState {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  email: string;
  name: string;
  roles: string[];
}

export interface AuthApiResult {
  ok: boolean;
  user?: WearlyUser | null;
  error?: string;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  email?: string;
  name?: string;
  roles?: string[];
  userId?: string;
  token?: string;
  confirmUrl?: string;
  data?: unknown;
}

const STORAGE_KEY = 'wearly.auth.v1';
const ONBOARDING_KEY = 'wearly.onboarding.v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly registerEndpoint = environment.auth?.registerEndpoint ?? '/api/Identity/register';
  private readonly confirmEmailEndpoint = environment.auth?.confirmEmailEndpoint ?? '/api/Identity/confirm-email';
  private readonly loginEndpoint = environment.auth?.loginEndpoint ?? '/api/Identity/login';
  private readonly refreshEndpoint = environment.auth?.refreshEndpoint ?? '/api/Identity/RefreshToken';
  private readonly forgotPasswordEndpoint = environment.auth?.forgotPasswordEndpoint ?? '/api/Identity/forget-password';
  private readonly resetPasswordEndpoint = environment.auth?.resetPasswordEndpoint ?? '/api/Identity/reset-password';
  private readonly logoutEndpoint = environment.auth?.logoutEndpoint ?? '/api/Identity/logout';
  private readonly logoutAllEndpoint = environment.auth?.logoutAllEndpoint ?? '/api/Identity/logout-all';
  private readonly apiBaseUrl = (environment.apiUrl ?? '').replace(/\/$/, '');

  private readonly _authState = signal<AuthState | null>(null);
  private refreshInProgress: Observable<AuthApiResult> | null = null;

  readonly user = computed<WearlyUser | null>(() => {
    const state = this._authState();
    return state ? { name: state.name, email: state.email, roles: [...state.roles] } : null;
  });
  readonly isLoggedIn = computed(() => this._authState() !== null);
  readonly isAdmin = computed(() => this.user()?.roles.some((role) => role.toLowerCase() === 'admin') ?? false);
  readonly role = computed<UserRole | null>(() => (this.isAdmin() ? 'admin' : this.isLoggedIn() ? 'user' : null));
  readonly accessToken = computed(() => this._authState()?.accessToken ?? '');
  readonly refreshToken = computed(() => this._authState()?.refreshToken ?? '');
  readonly expiresAt = computed(() => this._authState()?.expiresAt ?? '');

  constructor() {
    this.restore();
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as AuthState;
      if (stored?.accessToken && stored?.refreshToken && stored?.expiresAt && stored?.email && stored?.name && Array.isArray(stored.roles)) {
        this._authState.set(stored);
      }
    } catch {
      /* ignore */
    }
  }

  login(email: string, password: string): Observable<AuthApiResult> {
    const e = email.trim().toLowerCase();
    const p = password.trim();

    if (!e || !p) {
      return of({ ok: false, error: 'Email and password are required.', message: 'Email and password are required.' });
    }

    const payload = { email: e, password: p };
    console.log('Login request', payload);

    return this.http.post<unknown>(`${this.apiBaseUrl}${this.loginEndpoint}`, payload).pipe(
      map((response) => {
        console.log('Login success response', response);
        return this.normalizeLoginResponse(response);
      }),
      catchError((error) => {
        console.error('Login error response', error);
        const errorMessage = this.extractErrorMessage(error) ?? this.toStringOrUndefined((error as any)?.message) ?? `Login request failed.`;
        return of({ ok: false, error: errorMessage, message: errorMessage });
      }),
    );
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/api/Identity/external-login?provider=google`;
  }

  completeExternalLogin(state: AuthState): void {
    this.setAuthState(state);
  }

  refreshTokenRequest(): Observable<AuthApiResult> {
    const refreshToken = this.refreshToken().trim();
    if (!refreshToken) {
      return of({ ok: false, error: 'Missing refresh token.' });
    }

    if (this.refreshInProgress) {
      return this.refreshInProgress;
    }

    const payload = { refreshToken };
    console.log('Refresh token request', payload);

    this.refreshInProgress = this.http.post<unknown>(`${this.apiBaseUrl}${this.refreshEndpoint}`, payload).pipe(
      map((response) => {
        console.log('Refresh token success response', response);
        return this.normalizeRefreshResponse(response);
      }),
      catchError((error) => {
        console.error('Refresh token error response', error);
        const message = this.extractErrorMessage(error) ?? this.toStringOrUndefined((error as any)?.message) ?? 'Refresh token failed.';
        return of({ ok: false, error: message, message });
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    return this.refreshInProgress;
  }

  register(name: string, email: string, password: string): Observable<AuthApiResult> {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    const p = password.trim();

    if (!n || !e || !p) {
      return of({ ok: false, error: 'Name, email and password are required.' });
    }
    if (p.length < 6) {
      return of({ ok: false, error: 'Password must be at least 6 characters.' });
    }

    return this.http.post<unknown>(`${this.apiBaseUrl}${this.registerEndpoint}`, {
      name: n,
      email: e,
      password: p,
      confirmPassword: p,
    }).pipe(
      map((response) => {
        console.log('Registration API response', response);
        return this.normalizeRegistrationResponse(response);
      }),
      catchError((error) => {
        console.error('Registration API error response', error);
        const errorMessage = this.extractErrorMessage(error) ?? 'Registration failed.';
        return of({ ok: false, error: errorMessage, message: errorMessage });
      }),
    );
  }

  confirmEmail(userId: string, token: string): Observable<AuthApiResult> {
    const id = userId.trim();
    const authToken = token.trim();

    if (!id || !authToken) {
      return of({ ok: false, error: 'Missing confirmation details.', message: 'Missing confirmation details.' });
    }

    console.log('API Base URL', this.apiBaseUrl);
    console.log('Confirm Email URL', `${this.apiBaseUrl}${this.confirmEmailEndpoint}`);
    console.log('Sending confirm email request to', `${this.apiBaseUrl}${this.confirmEmailEndpoint}`);
    console.log({ userId: id, token: authToken });

    return this.http.post<unknown>(`${this.apiBaseUrl}${this.confirmEmailEndpoint}`, {
      userId: id,
      token: authToken,
    }).pipe(
      map((response) => {
        console.log('confirm success', response);
        return this.normalizeConfirmationResponse(response);
      }),
      catchError((error) => {
        console.log('confirm error', error);
        console.error('Confirm email backend error response', error);
        const errorMessage = this.extractErrorMessage(error) ?? 'Email confirmation failed.';
        return of({ ok: false, error: errorMessage, message: errorMessage });
      }),
    );
  }

  forgotPassword(email: string): Observable<AuthApiResult> {
    const e = email.trim().toLowerCase();

    if (!e) {
      return of({ ok: false, error: 'Email is required.', message: 'Email is required.' });
    }

    return this.http.post<unknown>(`${this.apiBaseUrl}${this.forgotPasswordEndpoint}`, { email: e }).pipe(
      map((response) => this.normalizeForgotPasswordResponse(response)),
      catchError((error) => {
        const message = this.extractErrorMessage(error) ?? this.toStringOrUndefined((error as any)?.message) ?? 'Password reset request failed.';
        return of({ ok: false, error: message, message });
      }),
    );
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<AuthApiResult> {
    const e = email.trim().toLowerCase();
    const authToken = token.trim();
    const password = newPassword.trim();

    if (!e || !authToken || !password) {
      return of({ ok: false, error: 'Email, token and new password are required.', message: 'Email, token and new password are required.' });
    }

    return this.http.post<unknown>(`${this.apiBaseUrl}${this.resetPasswordEndpoint}`, {
      email: e,
      token: authToken,
      newPassword: password,
    }).pipe(
      map((response) => this.normalizeResetPasswordResponse(response)),
      catchError((error) => {
        const message = this.extractErrorMessage(error) ?? this.toStringOrUndefined((error as any)?.message) ?? 'Password reset failed.';
        return of({ ok: false, error: message, message });
      }),
    );
  }

  logout(scope: LogoutScope = 'current-device'): Observable<AuthApiResult> {
    const payload = scope === 'current-device' ? { refreshToken: this.refreshToken().trim() } : {};
    const endpoint = scope === 'current-device' ? this.logoutEndpoint : this.logoutAllEndpoint;
    const requestLabel = scope === 'current-device' ? 'Logout request' : 'Logout all devices request';

    console.log(requestLabel, scope === 'current-device' ? payload : { endpoint: `${this.apiBaseUrl}${endpoint}` });

    return this.http.post<unknown>(`${this.apiBaseUrl}${endpoint}`, payload).pipe(
      map((response) => {
        console.log(scope === 'current-device' ? 'Logout success response' : 'Logout all devices success response', response);
        const result = this.normalizeLogoutResponse(response);
        if (result.ok) {
          this.clearAuthState();
        }
        return result;
      }),
      catchError((error) => {
        console.error(scope === 'current-device' ? 'Logout error response' : 'Logout all devices error response', error);
        const message = this.extractErrorMessage(error) ?? this.toStringOrUndefined((error as any)?.message) ?? (scope === 'current-device' ? 'Logout request failed.' : 'Logout all devices request failed.');
        return of({ ok: false, error: message, message });
      }),
    );
  }

  logoutAllDevices(): Observable<AuthApiResult> {
    return this.logout('all-devices');
  }

  hasCompletedOnboarding(): boolean {
    return localStorage.getItem(ONBOARDING_KEY) === 'completed';
  }

  markOnboardingComplete(): void {
    localStorage.setItem(ONBOARDING_KEY, 'completed');
  }

  resolvePostLoginRoute(): string {
    const role = this.role();
    if (role === 'admin') return '/control-center';
    return this.hasCompletedOnboarding() ? '/dashboard' : '/onboarding';
  }

  clearAuthState(): void {
    this._authState.set(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('wearly.ai.sessionId');
    this.refreshInProgress = null;
  }

  private setAuthState(state: AuthState): void {
    this._authState.set(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private normalizeLoginResponse(response: unknown): AuthApiResult {
    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      const ok = payload['succeeded'] === true;
      const message = this.extractDisplayMessage(payload);
      const data = payload['data'];
      const result: AuthApiResult = { ok, message, data };

      if (typeof data === 'object' && data !== null) {
        const dataPayload = data as Record<string, unknown>;
        result.accessToken = this.toStringOrUndefined(dataPayload['accessToken']);
        result.refreshToken = this.toStringOrUndefined(dataPayload['refreshToken']);
        result.expiresAt = this.toStringOrUndefined(dataPayload['expiresAt']);
        result.email = this.toStringOrUndefined(dataPayload['email']);
        result.name = this.toStringOrUndefined(dataPayload['name']);
        result.roles = Array.isArray(dataPayload['roles']) ? dataPayload['roles'].filter((r): r is string => typeof r === 'string') : [];
      }

      if (result.ok && result.accessToken && result.refreshToken && result.expiresAt && result.email && result.name && result.roles?.length) {
        this.setAuthState({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
          email: result.email,
          name: result.name,
          roles: result.roles,
        });
        result.user = {
          name: result.name,
          email: result.email,
          roles: result.roles,
        };
      }

      return result;
    }

    return { ok: true, message: 'Login successful.' };
  }

  private normalizeRefreshResponse(response: unknown): AuthApiResult {
    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      const ok = payload['succeeded'] === true;
      const message = this.extractDisplayMessage(payload);
      const data = payload['data'];
      const result: AuthApiResult = { ok, message, data };

      if (typeof data === 'object' && data !== null) {
        const dataPayload = data as Record<string, unknown>;
        result.accessToken = this.toStringOrUndefined(dataPayload['accessToken']);
        result.refreshToken = this.toStringOrUndefined(dataPayload['refreshToken']);
        result.expiresAt = this.toStringOrUndefined(dataPayload['expiresAt']);
        result.email = this.toStringOrUndefined(dataPayload['email']);
        result.name = this.toStringOrUndefined(dataPayload['name']);
        result.roles = Array.isArray(dataPayload['roles']) ? dataPayload['roles'].filter((r): r is string => typeof r === 'string') : [];
      }

      if (result.ok && result.accessToken && result.refreshToken && result.expiresAt && result.email && result.name && result.roles?.length) {
        this.setAuthState({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
          email: result.email,
          name: result.name,
          roles: result.roles,
        });
        result.user = {
          name: result.name,
          email: result.email,
          roles: result.roles,
        };
      }

      this.refreshInProgress = null;
      return result;
    }

    this.refreshInProgress = null;
    return { ok: false, error: 'Refresh failed.', message: 'Refresh failed.' };
  }

  private normalizeLogoutResponse(response: unknown): AuthApiResult {
    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;

      const ok = payload['succeeded'] === true;

      const data = typeof payload['data'] === 'string' ? payload['data'] : undefined;

      const message =
        data ??
        this.toStringOrUndefined(payload['meta']) ??
        this.toStringOrUndefined(payload['message']) ??
        (ok ? 'Signed out successfully.' : 'Logout failed.');

      return {
        ok,
        message,
        data: payload['data'],
      };
    }

    return {
      ok: false,
      message: 'Logout failed.',
    };
  }

  private normalizeForgotPasswordResponse(response: unknown): AuthApiResult {
    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      const ok = payload['succeeded'] === true;
      const message = this.extractDisplayMessage(payload) ?? (ok ? 'Password reset link sent successfully.' : 'Password reset request failed.');
      return { ok, message, data: payload['data'] };
    }

    return { ok: true, message: 'Password reset link sent successfully.' };
  }

  private normalizeResetPasswordResponse(response: unknown): AuthApiResult {
    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      const ok = payload['succeeded'] === true;
      const message = this.extractDisplayMessage(payload) ?? (ok ? 'Password reset successfully.' : 'Password reset failed.');
      return { ok, message, data: payload['data'] };
    }

    return { ok: true, message: 'Password reset successfully.' };
  }

  private normalizeRegistrationResponse(response: unknown): AuthApiResult {
    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      const ok = payload['succeeded'] === true;
      const message = this.extractDisplayMessage(payload);
      let userId = this.toStringOrUndefined(payload['userId']) ?? this.toStringOrUndefined(payload['userID']);
      let token = this.toStringOrUndefined(payload['token']) ?? this.toStringOrUndefined(payload['Token']);
      let confirmUrl = this.toStringOrUndefined(payload['confirmUrl']) ?? this.toStringOrUndefined(payload['confirm_url']);
      const data = payload['data'];

      if (typeof data === 'object' && data !== null) {
        const dataPayload = data as Record<string, unknown>;
        userId = userId ?? this.toStringOrUndefined(dataPayload['userId']) ?? this.toStringOrUndefined(dataPayload['userID']);
        token = token ?? this.toStringOrUndefined(dataPayload['token']) ?? this.toStringOrUndefined(dataPayload['Token']);
        confirmUrl = confirmUrl ?? this.toStringOrUndefined(dataPayload['confirmUrl']) ?? this.toStringOrUndefined(dataPayload['confirm_url']);
      }

      return {
        ok,
        message,
        userId,
        token,
        confirmUrl,
        data,
      };
    }

    return { ok: true, message: 'Registration successful. Please confirm your email.' };
  }

  private normalizeConfirmationResponse(response: unknown): AuthApiResult {
    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      const ok = payload['succeeded'] === true;
      const message = this.extractDisplayMessage(payload) ?? (ok ? 'Email confirmed successfully.' : 'Email confirmation failed.');
      return { ok, message, data: payload['data'] };
    }

    return { ok: true, message: 'Email confirmed successfully.' };
  }

  private extractDisplayMessage(payload: Record<string, unknown>): string | undefined {
    return this.toStringOrUndefined(payload['meta'])
      ?? this.extractDataMessage(payload['data'])
      ?? this.extractErrorMessage(payload['error'])
      ?? this.toStringOrUndefined(payload['message'])
      ?? this.toStringOrUndefined(payload['detail'])
      ?? this.toStringOrUndefined(payload['title'])
      ?? this.extractMessageFromErrors(payload['errors']);
  }

  private extractDataMessage(data: unknown): string | undefined {
    if (typeof data === 'object' && data !== null) {
      const nested = data as Record<string, unknown>;
      return this.toStringOrUndefined(nested['message'])
        ?? this.extractErrorMessage(nested['error'])
        ?? this.toStringOrUndefined(nested['detail'])
        ?? this.extractMessageFromErrors(nested['errors']);
    }

    return undefined;
  }

  private extractMessageFromErrors(errors: unknown): string | undefined {
    if (Array.isArray(errors)) {
      const values = errors
        .map((item) => this.toStringOrUndefined(item))
        .filter((item): item is string => Boolean(item));
      return values.length ? values.join(' ') : undefined;
    }

    if (typeof errors === 'object' && errors !== null) {
      const errorRecord = errors as Record<string, unknown>;
      const values = Object.values(errorRecord)
        .flatMap((value) => {
          if (Array.isArray(value)) {
            return value.map((item) => this.toStringOrUndefined(item)).filter((item): item is string => Boolean(item));
          }
          return this.toStringOrUndefined(value) ? [this.toStringOrUndefined(value)!] : [];
        });
      return values.length ? values.join(' ') : undefined;
    }

    return undefined;
  }

  private extractErrorMessage(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null) {
      const errorRecord = error as Record<string, unknown>;
      const message = this.toStringOrUndefined(errorRecord['message']) ?? this.toStringOrUndefined(errorRecord['error']);
      if (message) {
        return message;
      }
      if (typeof errorRecord['error'] === 'object' && errorRecord['error'] !== null) {
        const nested = errorRecord['error'] as Record<string, unknown>;
        return this.toStringOrUndefined(nested['message']) ?? this.toStringOrUndefined(nested['error']);
      }
      if (typeof errorRecord['error'] === 'string') {
        return errorRecord['error'];
      }
      if (typeof errorRecord['errors'] !== 'undefined') {
        return this.extractMessageFromErrors(errorRecord['errors']);
      }
    }
    return undefined;
  }

  private toStringOrUndefined(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }
}
