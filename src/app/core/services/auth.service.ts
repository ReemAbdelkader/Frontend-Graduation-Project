import { Injectable, signal, computed } from '@angular/core';

export type UserRole = 'user' | 'admin';

export interface WearlyUser {
  name: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = 'wearly.auth.v1';
const ONBOARDING_KEY = 'wearly.onboarding.v1';

/**
 * Standalone (no-backend) authentication service.
 *
 * Hardcoded admin credentials (your team will swap these for real
 * backend calls later):
 *   Email:    admin@itigraduation.com
 *   Password: Admin@123456
 *
 * Any other valid email + password combination logs in as a regular
 * user. The role is persisted in localStorage so it survives page
 * refreshes.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ADMIN_EMAIL = 'admin@itigraduation.com';
  private readonly ADMIN_PASSWORD = 'Admin@123456';

  private _user = signal<WearlyUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');
  readonly role = computed<UserRole | null>(() => this._user()?.role ?? null);

  constructor() {
    this.restore();
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this._user.set(JSON.parse(raw));
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * Attempt a login. Returns true on success, false on failure.
   * - admin@itigraduation.com / Admin@123456 → admin role
   * - any other email + non-empty password   → user role
   */
  login(email: string, password: string): { ok: boolean; user?: WearlyUser; error?: string } {
    const e = email.trim().toLowerCase();
    const p = password.trim();

    if (!e || !p) {
      return { ok: false, error: 'Email and password are required.' };
    }

    const isAdmin = e === this.ADMIN_EMAIL.toLowerCase();

    // The admin must use the exact seeded password.
    if (isAdmin && p !== this.ADMIN_PASSWORD) {
      return { ok: false, error: 'Invalid admin credentials.' };
    }

    const user: WearlyUser = {
      name: isAdmin ? 'Atelier Admin' : this.deriveNameFromEmail(e),
      email: e,
      role: isAdmin ? 'admin' : 'user',
    };

    this._user.set(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { ok: true, user };
  }

  /**
   * Standalone registration. Always creates a regular user (never admin).
   * Returns true on success.
   */
  register(name: string, email: string, password: string): { ok: boolean; user?: WearlyUser; error?: string } {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    const p = password.trim();

    if (!n || !e || !p) {
      return { ok: false, error: 'Name, email and password are required.' };
    }
    if (p.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    if (e === this.ADMIN_EMAIL.toLowerCase()) {
      return { ok: false, error: 'This email is reserved. Please use a different one.' };
    }

    const user: WearlyUser = { name: n, email: e, role: 'user' };
    this._user.set(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { ok: true, user };
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Returns true if the user has completed the onboarding chat. */
  hasCompletedOnboarding(): boolean {
    return localStorage.getItem(ONBOARDING_KEY) === 'completed';
  }

  markOnboardingComplete(): void {
    localStorage.setItem(ONBOARDING_KEY, 'completed');
  }

  /**
   * Returns the route the user should land on immediately after login.
   * admin → /control-center
   * user  → /onboarding (first login) or /dashboard (returning)
   */
  resolvePostLoginRoute(): string {
    const role = this.role();
    if (role === 'admin') return '/control-center';
    return this.hasCompletedOnboarding() ? '/dashboard' : '/onboarding';
  }

  private deriveNameFromEmail(email: string): string {
    const local = email.split('@')[0] ?? 'User';
    return local
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
}
