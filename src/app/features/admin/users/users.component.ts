import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  mockUsers,
  MockUser,
  AdminRole,
} from '../../../core/data/admin-mock-data';

type ConfirmKind = 'suspend' | 'delete';
interface ConfirmState { kind: ConfirmKind; user: MockUser; }

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent, DatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  private toast = inject(ToastService);

  readonly users = signal<MockUser[]>(mockUsers);
  readonly query = signal('');
  readonly confirm = signal<ConfirmState | null>(null);
  readonly showAddModal = signal(false);

  // Add-user form state
  readonly formName = signal('');
  readonly formEmail = signal('');
  readonly formPassword = signal('');
  readonly formRole = signal<AdminRole>('User');
  // Printer-specific
  readonly formCompanyName = signal('');
  readonly formLocation = signal('');
  readonly formCapacity = signal('');

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = this.users();
    if (!q) return list;
    return list.filter((u) =>
      `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q),
    );
  });

  setQuery(v: string): void { this.query.set(v); }

  // ============ Add User modal ============
  openAddModal(): void {
    this.formName.set('');
    this.formEmail.set('');
    this.formPassword.set('');
    this.formRole.set('User');
    this.formCompanyName.set('');
    this.formLocation.set('');
    this.formCapacity.set('');
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  setFormRole(v: AdminRole): void {
    this.formRole.set(v);
  }

  get showPrinterFields(): boolean {
    return this.formRole() === 'Printer';
  }

  submitAddUser(): void {
    const name = this.formName().trim();
    const email = this.formEmail().trim();
    const password = this.formPassword();

    if (!name || !email || !password) {
      this.toast.error('Full name, email and password are required.');
      return;
    }
    if (password.length < 6) {
      this.toast.error('Password must be at least 6 characters.');
      return;
    }

    const role = this.formRole();
    const newUser: MockUser = {
      id: `u${Date.now()}`,
      name: role === 'Printer' && this.formCompanyName()
        ? this.formCompanyName()
        : name,
      email,
      role,
      joinedAt: new Date().toISOString().slice(0, 10),
      status: 'active',
    };

    this.users.update((u) => [newUser, ...u]);
    this.toast.success(`${newUser.name} added as ${role}`);
    this.closeAddModal();
  }

  // ============ Existing user actions ============
  askSuspend(u: MockUser): void { this.confirm.set({ kind: 'suspend', user: u }); }
  askDelete(u: MockUser): void { this.confirm.set({ kind: 'delete', user: u }); }

  cancelConfirm(): void { this.confirm.set(null); }

  runConfirm(): void {
    const state = this.confirm() as ConfirmState | null;
    if (!state) return;
    const kind: ConfirmKind = state.kind;
    const user: MockUser = state.user;

    if (kind === 'suspend') {
      const next = user.status === 'active' ? 'suspended' : 'active';
      this.users.update((s) =>
        s.map((x) => (x.id === user.id ? { ...x, status: next } : x)),
      );
      this.toast.success(`${user.name} ${next === 'active' ? 'activated' : 'suspended'}`);
    } else if (kind === 'delete') {
      this.users.update((s) => s.filter((x) => x.id !== user.id));
      this.toast.success(`${user.name} deleted`);
    }
    this.confirm.set(null);
  }

  // ============ Helpers ============
  get confirmTitle(): string {
    const c = this.confirm() as ConfirmState | null;
    if (!c) return '';
    if (c.kind === 'delete') return `Delete ${c.user.name}?`;
    return `Update ${c.user.name}?`;
  }

  get confirmDescription(): string {
    const c = this.confirm() as ConfirmState | null;
    if (!c) return '';
    return c.kind === 'delete'
      ? 'This action cannot be undone.'
      : 'The change takes effect immediately.';
  }

  get confirmLabel(): string {
    const c = this.confirm() as ConfirmState | null;
    if (!c) return 'Confirm';
    return c.kind === 'delete' ? 'Delete' : 'Confirm';
  }

  get confirmDestructive(): boolean {
    return (this.confirm() as ConfirmState | null)?.kind === 'delete';
  }

  initialsOf(name?: string): string {
    return (name || '?')
      .split(' ')
      .map((p: string) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
