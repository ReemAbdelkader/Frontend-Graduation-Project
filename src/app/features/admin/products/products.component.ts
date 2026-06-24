import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  mockProducts,
  mockCategories,
  MockProduct,
} from '../../../core/data/admin-mock-data';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  private toast = inject(ToastService);

  readonly products = signal<MockProduct[]>(mockProducts);
  /** Category dropdown pulls from the categories list (not hardcoded separately). */
  readonly categories = signal(mockCategories.map((c) => c.name));

  // Modal state
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly formName = signal('');
  readonly formPrice = signal(0);
  readonly formCategory = signal('');
  readonly formStock = signal(0);
  readonly formImage = signal('');
  readonly formAvailable = signal(true);

  readonly deleteTarget = signal<MockProduct | null>(null);

  openCreate(): void {
    this.editingId.set(null);
    this.formName.set('');
    this.formPrice.set(0);
    this.formCategory.set(this.categories()[0] ?? '');
    this.formStock.set(0);
    this.formImage.set('assets/garment-tshirt-black.jpg');
    this.formAvailable.set(true);
    this.showModal.set(true);
  }

  openEdit(p: MockProduct): void {
    this.editingId.set(p.id);
    this.formName.set(p.name);
    this.formPrice.set(p.basePrice);
    this.formCategory.set(p.categoryName);
    this.formStock.set(p.stock);
    this.formImage.set(p.imageUrl);
    this.formAvailable.set(p.isAvailable);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submit(): void {
    const name = this.formName().trim();
    const category = this.formCategory();
    if (!name) { this.toast.error('Product name is required.'); return; }
    if (!category) { this.toast.error('Please select a category.'); return; }

    const body: Omit<MockProduct, 'id'> = {
      name,
      basePrice: this.formPrice(),
      categoryName: category,
      stock: this.formStock(),
      imageUrl: this.formImage().trim() || 'assets/garment-tshirt-black.jpg',
      isAvailable: this.formAvailable(),
    };

    const id = this.editingId();
    if (id) {
      this.products.update((s) => s.map((p) => (p.id === id ? { ...p, ...body } : p)));
      this.toast.success('Product updated.');
    } else {
      const newProd: MockProduct = { id: `p${Date.now()}`, ...body };
      this.products.update((s) => [newProd, ...s]);
      this.toast.success('Product created.');
    }
    this.closeModal();
  }

  askDelete(p: MockProduct): void { this.deleteTarget.set(p); }
  cancelDelete(): void { this.deleteTarget.set(null); }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.products.update((s) => s.filter((p) => p.id !== target.id));
    this.toast.success(`${target.name} deleted.`);
    this.deleteTarget.set(null);
  }
}
