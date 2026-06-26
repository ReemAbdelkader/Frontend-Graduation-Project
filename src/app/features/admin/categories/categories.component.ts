import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  AdminApiService,
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  private toast = inject(ToastService);
  private adminApi = inject(AdminApiService);

  readonly categories = signal<CategoryDto[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  // Modal state (used for both create + edit)
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly formName = signal('');
  readonly formDescription = signal('');
  readonly formImageUrl = signal('');
  readonly formPrintableAreaConfig = signal('');

  // Delete confirm
  readonly deleteTarget = signal<CategoryDto | null>(null);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminApi.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load categories.');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formImageUrl.set('');
    this.formPrintableAreaConfig.set('');
    this.showModal.set(true);
  }

  openEdit(c: CategoryDto): void {
    this.editingId.set(c.id);
    this.formName.set(c.name);
    this.formDescription.set('');
    this.formImageUrl.set('');
    this.formPrintableAreaConfig.set('');
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

    const id = this.editingId();
    const printableAreaConfig = this.formPrintableAreaConfig().trim();
    this.saving.set(true);

    if (id) {
      const body: UpdateCategoryRequest = {
        name,
        description: this.optionalValue(this.formDescription()),
        imageUrl: this.optionalValue(this.formImageUrl()),
        printableAreaConfig: printableAreaConfig || null,
      };
      this.adminApi.updateCategory(id, body).subscribe({
        next: () => {
          this.toast.success('Category updated.');
          this.closeModal();
          this.saving.set(false);
          this.loadCategories();
        },
        error: () => {
          this.toast.error('Category update failed.');
          this.saving.set(false);
        },
      });
    } else {
      if (!printableAreaConfig) {
        this.toast.error('Printable area config is required.');
        this.saving.set(false);
        return;
      }
      const body: CreateCategoryRequest = {
        name,
        description: this.optionalValue(this.formDescription()),
        imageUrl: this.optionalValue(this.formImageUrl()),
        printableAreaConfig,
      };
      this.adminApi.createCategory(body).subscribe({
        next: () => {
          this.toast.success('Category created.');
          this.closeModal();
          this.saving.set(false);
          this.loadCategories();
        },
        error: () => {
          this.toast.error('Category creation failed.');
          this.saving.set(false);
        },
      });
    }
  }

  askDelete(c: CategoryDto): void {
    this.deleteTarget.set(c);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.adminApi.deleteCategory(target.id).subscribe({
      next: () => {
        this.toast.success(`${target.name} deleted.`);
        this.deleteTarget.set(null);
        this.loadCategories();
      },
      error: () => {
        this.toast.error('Category deletion failed.');
        this.deleteTarget.set(null);
      },
    });
  }

  private optionalValue(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
