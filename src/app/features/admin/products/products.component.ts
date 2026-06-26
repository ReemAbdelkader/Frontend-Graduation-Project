import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  AdminApiService,
  CategoryDto,
  CreateProductRequest,
  ProductDto,
  UpdateProductRequest,
} from '../../../core/services/admin-api.service';

interface ColorOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  private toast = inject(ToastService);
  private adminApi = inject(AdminApiService);

  readonly products = signal<ProductDto[]>([]);
  readonly categories = signal<CategoryDto[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly colorOptions: ColorOption[] = [
    { label: 'Red', value: 1 },
    { label: 'Blue', value: 2 },
    { label: 'Green', value: 4 },
    { label: 'Yellow', value: 8 },
    { label: 'Black', value: 16 },
    { label: 'White', value: 32 },
    { label: 'Orange', value: 64 },
    { label: 'Purple', value: 128 },
    { label: 'Pink', value: 256 },
    { label: 'Gray', value: 512 },
    { label: 'Brown', value: 1024 },
    { label: 'Cyan', value: 2048 },
    { label: 'Magenta', value: 4096 },
    { label: 'Lime', value: 8192 },
    { label: 'Maroon', value: 16384 },
  ];

  readonly stockStatuses = ['InStock', 'LowStock', 'OutOfStock', 'Discontinued'];

  // Modal state
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly formName = signal('');
  readonly formPrice = signal(0);
  readonly formCategoryId = signal('');
  readonly formImage = signal('');
  readonly formAvailable = signal(true);
  readonly formAvailableColors = signal(0);
  readonly formStockStatus = signal('');

  readonly deleteTarget = signal<ProductDto | null>(null);

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      products: this.adminApi.getProducts(1, 100),
      categories: this.adminApi.getCategories(),
    }).subscribe({
      next: ({ products, categories }) => {
        this.products.set(products.data ?? []);
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load products.');
        this.loading.set(false);
      },
    });
  }

  refreshProducts(): void {
    this.adminApi.getProducts(1, 100).subscribe({
      next: (products) => this.products.set(products.data ?? []),
      error: () => this.toast.error('Product list refresh failed.'),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formName.set('');
    this.formPrice.set(0);
    this.formCategoryId.set(this.categories()[0]?.id ?? '');
    this.formImage.set('');
    this.formAvailable.set(true);
    this.formAvailableColors.set(0);
    this.formStockStatus.set(this.stockStatuses[0] ?? '');
    this.showModal.set(true);
  }

  openEdit(p: ProductDto): void {
    this.editingId.set(p.id);
    this.formName.set(p.name);
    this.formPrice.set(p.basePrice);
    this.formCategoryId.set('');
    this.formImage.set(p.previewImageUrl);
    this.formAvailable.set(p.isAvailable);
    this.formAvailableColors.set(0);
    this.formStockStatus.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  toggleColor(value: number, checked: boolean): void {
    this.formAvailableColors.update((current) => checked ? current | value : current & ~value);
  }

  hasColor(value: number): boolean {
    return (this.formAvailableColors() & value) === value;
  }

  submit(): void {
    const name = this.formName().trim();
    const previewImageURL = this.formImage().trim();
    if (!name) { this.toast.error('Product name is required.'); return; }
    if (this.formPrice() < 0) { this.toast.error('Base price cannot be negative.'); return; }

    const id = this.editingId();
    this.saving.set(true);

    if (id) {
      const payload: UpdateProductRequest = {
        name,
        basePrice: this.formPrice(),
        previewImageURL: previewImageURL || null,
        isAvailable: this.formAvailable(),
        availableColors: this.formAvailableColors() > 0 ? this.formAvailableColors() : null,
        stockStatus: this.formStockStatus().trim() || null,
      };

      this.adminApi.updateProduct(id, payload).subscribe({
        next: () => {
          this.toast.success('Product updated.');
          this.closeModal();
          this.saving.set(false);
          this.refreshProducts();
        },
        error: () => {
          this.toast.error('Product update failed.');
          this.saving.set(false);
        },
      });
      return;
    }

    if (!this.formCategoryId()) {
      this.toast.error('Please select a category.');
      this.saving.set(false);
      return;
    }
    if (this.formAvailableColors() <= 0) {
      this.toast.error('Select at least one available color.');
      this.saving.set(false);
      return;
    }
    if (!this.formStockStatus().trim()) {
      this.toast.error('Stock status is required.');
      this.saving.set(false);
      return;
    }

    const payload: CreateProductRequest = {
      categoryId: this.formCategoryId(),
      name,
      basePrice: this.formPrice(),
      availableColors: this.formAvailableColors(),
      previewImageURL: previewImageURL || '',
      isAvailable: this.formAvailable(),
      stockStatus: this.formStockStatus().trim(),
    };

    this.adminApi.createProduct(payload).subscribe({
      next: () => {
        this.toast.success('Product created.');
        this.closeModal();
        this.saving.set(false);
        this.refreshProducts();
      },
      error: () => {
        this.toast.error('Product creation failed.');
        this.saving.set(false);
      },
    });
  }

  askDelete(p: ProductDto): void { this.deleteTarget.set(p); }
  cancelDelete(): void { this.deleteTarget.set(null); }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.adminApi.deleteProduct(target.id).subscribe({
      next: () => {
        this.toast.success(`${target.name} deleted.`);
        this.deleteTarget.set(null);
        this.refreshProducts();
      },
      error: () => {
        this.toast.error('Product deletion failed.');
        this.deleteTarget.set(null);
      },
    });
  }

  imageUrl(url: string): string {
    return this.adminApi.resolveAssetUrl(url);
  }

  formatCurrency(n: number): string {
    return '$' + (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}
