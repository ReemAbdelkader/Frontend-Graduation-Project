import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { mockCategories, MockCategory } from '../../../core/data/admin-mock-data';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent {
  private toast = inject(ToastService);

  readonly categories = signal<MockCategory[]>(mockCategories);

  // Modal state (used for both create + edit)
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly formName = signal('');
  readonly formDescription = signal('');
  readonly formImageUrl = signal('');

  // Delete confirm
  readonly deleteTarget = signal<MockCategory | null>(null);

  openCreate(): void {
    this.editingId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formImageUrl.set('');
    this.showModal.set(true);
  }

  openEdit(c: MockCategory): void {
    this.editingId.set(c.id);
    this.formName.set(c.name);
    this.formDescription.set(c.description);
    this.formImageUrl.set(c.imageUrl);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submit(): void {
    const name = this.formName().trim();
    if (!name) {
      this.toast.error('Category name is required.');
      return;
    }

    const body: Omit<MockCategory, 'id'> = {
      name,
      description: this.formDescription().trim(),
      imageUrl: this.formImageUrl().trim() || 'assets/garment-tshirt-black.jpg',
    };

    const id = this.editingId();
    if (id) {
      this.categories.update((s) =>
        s.map((c) => (c.id === id ? { ...c, ...body } : c)),
      );
      this.toast.success('Category updated.');
    } else {
      const newCat: MockCategory = { id: `c${Date.now()}`, ...body };
      this.categories.update((s) => [newCat, ...s]);
      this.toast.success('Category created.');
    }
    this.closeModal();
  }

  askDelete(c: MockCategory): void {
    this.deleteTarget.set(c);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.categories.update((s) => s.filter((c) => c.id !== target.id));
    this.toast.success(`${target.name} deleted.`);
    this.deleteTarget.set(null);
  }
}
