import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  AdminApiService,
  CategoryDto,
  CreateProductRequest,
  ProductDto,
  UpdateProductRequest,
  extractAdminApiError,
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
  readonly formAvailable = signal(true);
  readonly formAvailableColors = signal(31); // Common default (Red+Blue+Green+Yellow+Black)
  readonly formStockStatus = signal('');

  // Image files & view settings
  frontImageFile: File | null = null;
  readonly frontImagePreview = signal<string | null>(null);
  readonly frontDisplayOrder = signal(1);
  readonly frontPrintableZone = signal('{"x":280,"y":300,"width":440,"height":290}');

  backImageFile: File | null = null;
  readonly backImagePreview = signal<string | null>(null);
  readonly backDisplayOrder = signal(2);
  readonly backPrintableZone = signal('{"x":280,"y":300,"width":440,"height":290}');

  readonly primaryView = signal<'front' | 'back'>('front');

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
    this.formAvailable.set(true);
    this.formAvailableColors.set(31);
    this.formStockStatus.set(this.stockStatuses[0] ?? 'InStock');

    this.frontImageFile = null;
    this.frontImagePreview.set(null);
    this.frontDisplayOrder.set(1);
    this.frontPrintableZone.set('{"x":280,"y":300,"width":440,"height":290}');

    this.backImageFile = null;
    this.backImagePreview.set(null);
    this.backDisplayOrder.set(2);
    this.backPrintableZone.set('{"x":280,"y":300,"width":440,"height":290}');

    this.primaryView.set('front');
    this.showModal.set(true);
  }

  openEdit(p: ProductDto): void {
    this.editingId.set(p.id);
    this.formName.set(p.name);
    this.formPrice.set(p.basePrice);
    this.formCategoryId.set('');
    this.formAvailable.set(p.isAvailable);
    this.formAvailableColors.set(31);
    this.formStockStatus.set('InStock');

    this.frontImageFile = null;
    this.frontImagePreview.set(p.previewImageUrl ? this.adminApi.resolveAssetUrl(p.previewImageUrl) : null);
    this.frontDisplayOrder.set(1);
    this.frontPrintableZone.set('{"x":280,"y":300,"width":440,"height":290}');

    this.backImageFile = null;
    this.backImagePreview.set(null);
    this.backDisplayOrder.set(2);
    this.backPrintableZone.set('{"x":280,"y":300,"width":440,"height":290}');
    this.primaryView.set('front');

    // Fetch product images to display existing front/back details
    this.adminApi.getProductImages(p.id).subscribe({
      next: (images) => {
        const front = images.find((img) => img.viewAngle === 1 || img.viewAngle === 'Front');
        const back = images.find((img) => img.viewAngle === 2 || img.viewAngle === 'Back');

        if (front) {
          this.frontImagePreview.set(this.adminApi.resolveAssetUrl(front.imageUrl));
          this.frontDisplayOrder.set(front.displayOrder);
          this.frontPrintableZone.set(front.printableZoneJson || '{"x":280,"y":300,"width":440,"height":290}');
          if (front.isPrimary) this.primaryView.set('front');
        }

        if (back) {
          this.backImagePreview.set(this.adminApi.resolveAssetUrl(back.imageUrl));
          this.backDisplayOrder.set(back.displayOrder);
          this.backPrintableZone.set(back.printableZoneJson || '{"x":280,"y":300,"width":440,"height":290}');
          if (back.isPrimary) this.primaryView.set('back');
        }
      },
    });

    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  toggleColor(value: number, checked: boolean): void {
    this.formAvailableColors.update((current) => (checked ? current | value : current & ~value));
  }

  hasColor(value: number): boolean {
    return (this.formAvailableColors() & value) === value;
  }

  onFrontImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.frontImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.frontImagePreview.set(reader.result as string);
      reader.readAsDataURL(this.frontImageFile);
    }
  }

  onBackImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.backImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.backImagePreview.set(reader.result as string);
      reader.readAsDataURL(this.backImageFile);
    }
  }

  submit(): void {
    const name = this.formName().trim();
    if (!name) {
      this.toast.error('Product name is required.');
      return;
    }
    if (this.formPrice() < 0) {
      this.toast.error('Base price cannot be negative.');
      return;
    }

    const id = this.editingId();
    this.saving.set(true);

    if (id) {
      // EDIT EXISTING PRODUCT
      const payload: UpdateProductRequest = {
        name,
        basePrice: this.formPrice(),
        previewImageURL: null,
        isAvailable: this.formAvailable(),
        availableColors: this.formAvailableColors() > 0 ? this.formAvailableColors() : null,
        stockStatus: this.formStockStatus().trim() || null,
      };

      this.adminApi.updateProduct(id, payload).subscribe({
        next: () => {
          const uploadObs: Observable<string>[] = [];

          if (this.frontImageFile) {
            uploadObs.push(
              this.adminApi.uploadProductImage({
                productId: id,
                imageFile: this.frontImageFile,
                viewAngle: 1, // Front
                isPrimary: this.primaryView() === 'front',
                displayOrder: this.frontDisplayOrder(),
                printableZoneJson: this.frontPrintableZone(),
              })
            );
          }

          if (this.backImageFile) {
            uploadObs.push(
              this.adminApi.uploadProductImage({
                productId: id,
                imageFile: this.backImageFile,
                viewAngle: 2, // Back
                isPrimary: this.primaryView() === 'back',
                displayOrder: this.backDisplayOrder(),
                printableZoneJson: this.backPrintableZone(),
              })
            );
          }

          if (uploadObs.length > 0) {
            forkJoin(uploadObs).subscribe({
              next: () => {
                this.toast.success('Product and images updated successfully.');
                this.closeModal();
                this.saving.set(false);
                this.refreshProducts();
              },
              error: (err) => {
                this.toast.error(extractAdminApiError(err, 'Product updated, but image upload failed.'));
                this.closeModal();
                this.saving.set(false);
                this.refreshProducts();
              },
            });
          } else {
            this.toast.success('Product updated successfully.');
            this.closeModal();
            this.saving.set(false);
            this.refreshProducts();
          }
        },
        error: (err) => {
          this.toast.error(extractAdminApiError(err, 'Product update failed.'));
          this.saving.set(false);
        },
      });
      return;
    }

    // CREATE NEW PRODUCT
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
    if (!this.frontImageFile) {
      this.toast.error('Please select a Front view image file.');
      this.saving.set(false);
      return;
    }

    const payload: CreateProductRequest = {
      categoryId: this.formCategoryId(),
      name,
      basePrice: this.formPrice(),
      availableColors: this.formAvailableColors(),
      previewImageURL: '', // Handled by primary image upload
      isAvailable: this.formAvailable(),
      stockStatus: this.formStockStatus().trim() || 'InStock',
    };

    this.adminApi.createProduct(payload).subscribe({
      next: (product) => {
        const productId = product.id;
        const uploadObs: Observable<string>[] = [];

        if (this.frontImageFile) {
          uploadObs.push(
            this.adminApi.uploadProductImage({
              productId,
              imageFile: this.frontImageFile,
              viewAngle: 1, // Front
              isPrimary: this.primaryView() === 'front',
              displayOrder: this.frontDisplayOrder(),
              printableZoneJson: this.frontPrintableZone(),
            })
          );
        }

        if (this.backImageFile) {
          uploadObs.push(
            this.adminApi.uploadProductImage({
              productId,
              imageFile: this.backImageFile,
              viewAngle: 2, // Back
              isPrimary: this.primaryView() === 'back',
              displayOrder: this.backDisplayOrder(),
              printableZoneJson: this.backPrintableZone(),
            })
          );
        }

        if (uploadObs.length > 0) {
          forkJoin(uploadObs).subscribe({
            next: () => {
              this.toast.success('Product created with images uploaded.');
              this.closeModal();
              this.saving.set(false);
              this.refreshProducts();
            },
            error: (err) => {
              this.toast.error(extractAdminApiError(err, 'Product created, but image uploads failed.'));
              this.closeModal();
              this.saving.set(false);
              this.refreshProducts();
            },
          });
        } else {
          this.toast.success('Product created successfully.');
          this.closeModal();
          this.saving.set(false);
          this.refreshProducts();
        }
      },
      error: (err) => {
        this.toast.error(extractAdminApiError(err, 'Product creation failed.'));
        this.saving.set(false);
      },
    });
  }

  askDelete(p: ProductDto): void {
    this.deleteTarget.set(p);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.adminApi.deleteProduct(target.id).subscribe({
      next: () => {
        this.toast.success(`${target.name} deleted.`);
        this.deleteTarget.set(null);
        this.refreshProducts();
      },
      error: (err) => {
        this.toast.error(extractAdminApiError(err, 'Product deletion failed.'));
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
