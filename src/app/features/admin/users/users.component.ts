import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  AdminApiService,
  AdminRole,
  InviteUserRequest,
  UserListItemDto,
} from '../../../core/services/admin-api.service';

interface StatusConfirmState {
  user: UserListItemDto;
  nextActive: boolean;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent, DatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private toast = inject(ToastService);
  private adminApi = inject(AdminApiService);

  readonly users = signal<UserListItemDto[]>([]);
  readonly query = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirm = signal<StatusConfirmState | null>(null);
  readonly showAddModal = signal(false);
  readonly changingRoleId = signal<string | null>(null);

  readonly roles: AdminRole[] = ['User', 'Printer', 'Admin'];

  readonly formName = signal('');
  readonly formEmail = signal('');
  readonly formRole = signal<AdminRole>('User');

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = this.users();
    if (!q) return list;
    return list.filter((u) =>
      `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminApi.getUsers(1, 100).subscribe({
      next: (result) => {
        this.users.set(result.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.extractError(err, 'Unable to load users.'));
        this.loading.set(false);
      },
    });
  }

  setQuery(v: string): void {
    this.query.set(v);
  }

  openAddModal(): void {
    this.formName.set('');
    this.formEmail.set('');
    this.formRole.set('User');
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  setFormRole(v: AdminRole): void {
    this.formRole.set(v);
  }

  submitAddUser(): void {
    const name = this.formName().trim();
    const email = this.formEmail().trim();

    if (!name || !email) {
      this.toast.error('Full name and email are required.');
      return;
    }

    const payload: InviteUserRequest = {
      name,
      email,
      role: this.formRole(),
    };

    this.saving.set(true);
    this.adminApi.inviteUser(payload).subscribe({
      next: () => {
        this.toast.success(`${name} invited as ${this.formRole()}`);
        this.saving.set(false);
        this.closeAddModal();
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(this.extractError(err, 'User invite failed.'));
        this.saving.set(false);
      },
    });
  }

  askSuspend(u: UserListItemDto): void {
    this.confirm.set({ user: u, nextActive: !u.isActive });
  }

  cancelConfirm(): void {
    this.confirm.set(null);
  }

  runConfirm(): void {
    const state = this.confirm();
    if (!state) return;

    this.adminApi.changeUserStatus(state.user.id, { isActive: state.nextActive }).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((x) =>
            x.id === state.user.id ? { ...x, isActive: state.nextActive } : x,
          ),
        );
        const action = state.nextActive ? 'activated' : 'suspended';
        this.toast.success(`${state.user.name} ${action}`);
        this.confirm.set(null);
      },
      error: (err) => {
        this.toast.error(this.extractError(err, 'Status update failed.'));
        this.confirm.set(null);
      },
    });
  }

  onRoleChange(user: UserListItemDto, newRole: AdminRole): void {
    if (newRole === user.role) return;

    this.changingRoleId.set(user.id);
    this.adminApi.changeUserRole(user.id, { newRole }).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
        );
        this.toast.success(`${user.name} role updated to ${newRole}`);
        this.changingRoleId.set(null);
      },
      error: (err) => {
        this.toast.error(this.extractError(err, 'Role update failed.'));
        this.changingRoleId.set(null);
      },
    });
  }

  get confirmTitle(): string {
    const c = this.confirm();
    if (!c) return '';
    return c.nextActive ? `Activate ${c.user.name}?` : `Suspend ${c.user.name}?`;
  }

  get confirmDescription(): string {
    return 'The change takes effect immediately.';
  }

  get confirmLabel(): string {
    const c = this.confirm();
    if (!c) return 'Confirm';
    return c.nextActive ? 'Activate' : 'Suspend';
  }

  get confirmDestructive(): boolean {
    const c = this.confirm();
    return !!c && !c.nextActive;
  }

  roleClass(role: string): string {
    return `role-${(role || 'User').toLowerCase()}`;
  }

  initialsOf(name?: string): string {
    return (name || '?')
      .split(' ')
      .map((p: string) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private extractError(error: unknown, fallback: string): string {
    const err = error as { error?: { message?: string; errors?: string[] } | string; message?: string };
    if (typeof err?.error === 'string') return err.error;
    return err?.error?.message ?? err?.error?.errors?.join(', ') ?? err?.message ?? fallback;
  }
}
