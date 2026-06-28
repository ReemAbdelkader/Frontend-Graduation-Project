import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL, resolveApiUrl } from './api-config';
import { ApiEnvelope, PaginatedResult } from './templates-api.service';

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
export type ModerationStatus = 'Pending' | 'Reviewed' | 'ActionTaken' | 'Dismissed';
export type AdminRole = 'Admin' | 'User' | 'Printer';

export interface DashboardOverviewDto {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  totalTemplates: number;
  publicTemplates: number;
  pendingModerationReports: number;
}

export interface OrderStatusCountDto {
  status: OrderStatus | string;
  count: number;
}

export interface AdminOrderItemDto {
  id: string;
  designName: string;
  snapshotImageURL: string;
  quantity: number;
  unitPrice: number;
  status: string;
  printerProfileId?: string | null;
  printerName?: string | null;
}

export interface RecentOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  orderItems?: AdminOrderItemDto[];
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface ProductDto {
  id: string;
  name: string;
  basePrice: number;
  categoryName: string;
  previewImageUrl: string;
  isAvailable: boolean;
  averageRating: number;
  reviewCount: number;
}

export interface ProductImageDto {
  id: string;
  productId: string;
  imageUrl: string;
  viewAngle: number | string | null;
  printableZoneJson: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface CreateProductImageRequest {
  productId: string;
  imageFile: File;
  color?: number | null;
  viewAngle?: number | null;
  printableZoneJson?: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface TemplateDto {
  id: string;
  name: string;
  previewImageURL: string;
  styleTags: string | null;
  isPublic: boolean;
  likesCount: number;
  remixesCount: number;
  creatorUserId: string;
  creatorName: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
}

export interface TemplateDetailDto extends TemplateDto {
  averageRating: number;
  reviewCount: number;
}

export interface ModerationReportDto {
  id: string;
  reporterUserId: string;
  reporterName: string;
  targetTemplateId: string;
  targetTemplateName: string;
  reason: string;
  status: ModerationStatus;
  actionTaken?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface UserListItemDto {
  id: string;
  name: string;
  email: string;
  role: AdminRole | string;
  joinedAt: string;
  isActive: boolean;
  emailConfirmed: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
  printableAreaConfig: string;
  imageUrl?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string | null;
  description?: string | null;
  printableAreaConfig?: string | null;
  imageUrl?: string | null;
}

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  basePrice: number;
  availableColors: number;
  previewImageURL: string;
  isAvailable: boolean;
  stockStatus: string;
}

export interface UpdateProductRequest {
  name?: string | null;
  basePrice?: number | null;
  availableColors?: number | null;
  previewImageURL?: string | null;
  isAvailable?: boolean | null;
  stockStatus?: string | null;
}

export interface InviteUserRequest {
  name: string;
  email: string;
  role: AdminRole;
  supportedFabrics?: number | null;
  supportedPrintMethods?: number | null;
}

export interface ChangeUserStatusRequest {
  isActive: boolean;
}

export interface ChangeUserRoleRequest {
  newRole: AdminRole;
}

export interface UpdateModerationReportRequest {
  actionTaken?: string | null;
  status?: ModerationStatus | null;
}

export interface ReportChatResponseDto {
  sessionId: string;
  userMessageId: string;
  aiMessageId: string;
  response: string;
  responseTime: string;
}

export function extractAdminApiError(error: unknown, fallback: string): string {
  const err = error as {
    error?: { message?: string; errors?: unknown } | string;
    message?: string;
  };

  if (typeof err?.error === 'string') return err.error;
  if (err?.error?.message) return err.error.message;

  const errors = err?.error?.errors;
  if (Array.isArray(errors)) {
    const message = errors.filter((value): value is string => typeof value === 'string').join(', ');
    if (message) return message;
  } else if (errors && typeof errors === 'object') {
    const message = Object.values(errors)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === 'string')
      .join(', ');
    if (message) return message;
  }

  return err?.message ?? fallback;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(private readonly http: HttpClient) {}

  getDashboardOverview(): Observable<DashboardOverviewDto> {
    return this.http
      .get<ApiEnvelope<DashboardOverviewDto>>(`${API_BASE_URL}/admin/dashboard/overview`)
      .pipe(map((response) => this.unwrap(response)));
  }

  getOrdersByStatus(): Observable<OrderStatusCountDto[]> {
    return this.http
      .get<ApiEnvelope<OrderStatusCountDto[]>>(`${API_BASE_URL}/admin/dashboard/orders-by-status`)
      .pipe(map((response) => this.unwrap(response) ?? []));
  }

  getRecentOrders(count = 10): Observable<RecentOrderDto[]> {
    const params = new HttpParams().set('count', count);
    return this.http
      .get<ApiEnvelope<RecentOrderDto[]>>(`${API_BASE_URL}/admin/dashboard/recent-orders`, { params })
      .pipe(map((response) => this.unwrap(response) ?? []));
  }

  getAllOrders(
    pageNumber = 1,
    pageSize = 100,
    status?: OrderStatus,
    search?: string,
  ): Observable<PaginatedResult<RecentOrderDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (status) {
      params = params.set('status', status);
    }

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http
      .get<ApiEnvelope<PaginatedResult<RecentOrderDto>>>(`${API_BASE_URL}/admin/orders`, { params })
      .pipe(
        map((response) => {
          const result = this.unwrap(response);
          return {
            ...result,
            data: (result.data ?? []).map((order) => this.normalizeRecentOrder(order)),
          };
        }),
      );
  }

  private normalizeRecentOrder(order: RecentOrderDto | Record<string, unknown>): RecentOrderDto {
    const raw = order as Record<string, unknown>;
    const rawItems = (raw['orderItems'] ?? raw['OrderItems']) as AdminOrderItemDto[] | undefined;

    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      orderNumber: String(raw['orderNumber'] ?? raw['OrderNumber'] ?? ''),
      customerName: String(raw['customerName'] ?? raw['CustomerName'] ?? ''),
      totalAmount: Number(raw['totalAmount'] ?? raw['TotalAmount'] ?? 0),
      status: (raw['status'] ?? raw['Status'] ?? 'Pending') as OrderStatus,
      createdAt: String(raw['createdAt'] ?? raw['CreatedAt'] ?? ''),
      orderItems: Array.isArray(rawItems) ? rawItems.map((item) => this.normalizeOrderItem(item)) : [],
    };
  }

  private normalizeOrderItem(item: AdminOrderItemDto | Record<string, unknown>): AdminOrderItemDto {
    const raw = item as Record<string, unknown>;
    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      designName: String(raw['designName'] ?? raw['DesignName'] ?? 'Custom Design'),
      snapshotImageURL: String(raw['snapshotImageURL'] ?? raw['SnapshotImageURL'] ?? ''),
      quantity: Number(raw['quantity'] ?? raw['Quantity'] ?? 0),
      unitPrice: Number(raw['unitPrice'] ?? raw['UnitPrice'] ?? 0),
      status: String(raw['status'] ?? raw['Status'] ?? 'Pending'),
      printerProfileId: (raw['printerProfileId'] ?? raw['PrinterProfileId'] ?? null) as string | null,
      printerName: (raw['printerName'] ?? raw['PrinterName'] ?? null) as string | null,
    };
  }

  getCategories(): Observable<CategoryDto[]> {
    return this.http
      .get<ApiEnvelope<CategoryDto[]>>(`${API_BASE_URL}/categories`)
      .pipe(map((response) => this.unwrap(response) ?? []));
  }

  createCategory(payload: CreateCategoryRequest): Observable<CategoryDto> {
    return this.http
      .post<ApiEnvelope<CategoryDto>>(`${API_BASE_URL}/categories`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  updateCategory(id: string, payload: UpdateCategoryRequest): Observable<CategoryDto> {
    return this.http
      .put<ApiEnvelope<CategoryDto>>(`${API_BASE_URL}/categories/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  deleteCategory(id: string): Observable<string | null> {
    return this.http
      .delete<ApiEnvelope<string | null>>(`${API_BASE_URL}/categories/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  getProducts(pageNumber = 1, pageSize = 100, categoryId?: string | null): Observable<PaginatedResult<ProductDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }

    return this.http
      .get<ApiEnvelope<PaginatedResult<ProductDto>>>(`${API_BASE_URL}/products`, { params })
      .pipe(map((response) => this.unwrap(response)));
  }

  createProduct(payload: CreateProductRequest): Observable<ProductDto> {
    return this.http
      .post<ApiEnvelope<ProductDto>>(`${API_BASE_URL}/products`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  updateProduct(id: string, payload: UpdateProductRequest): Observable<ProductDto> {
    return this.http
      .put<ApiEnvelope<ProductDto>>(`${API_BASE_URL}/products/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  deleteProduct(id: string): Observable<string> {
    return this.http
      .delete<ApiEnvelope<string>>(`${API_BASE_URL}/products/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  getProductImages(productId: string): Observable<ProductImageDto[]> {
    return this.http
      .get<ApiEnvelope<ProductImageDto[]>>(`${API_BASE_URL}/products/${productId}/images`)
      .pipe(map((response) => this.unwrap(response) ?? []));
  }

  uploadProductImage(request: CreateProductImageRequest): Observable<string> {
    const formData = new FormData();
    formData.append('ProductId', request.productId);
    formData.append('ImageFile', request.imageFile);
    if (request.color !== undefined && request.color !== null) {
      formData.append('Color', request.color.toString());
    }
    if (request.viewAngle !== undefined && request.viewAngle !== null) {
      formData.append('ViewAngle', request.viewAngle.toString());
    }
    if (request.printableZoneJson) {
      formData.append('PrintableZoneJson', request.printableZoneJson);
    }
    formData.append('IsPrimary', request.isPrimary.toString());
    formData.append('DisplayOrder', request.displayOrder.toString());

    return this.http.post<string>(`${API_BASE_URL}/products/product-images`, formData);
  }

  getTemplates(pageNumber = 1, pageSize = 100): Observable<PaginatedResult<TemplateDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http
      .get<ApiEnvelope<PaginatedResult<TemplateDto>>>(`${API_BASE_URL}/templates`, { params })
      .pipe(map((response) => this.unwrap(response)));
  }

  getTemplate(id: string): Observable<TemplateDetailDto> {
    return this.http
      .get<ApiEnvelope<TemplateDetailDto>>(`${API_BASE_URL}/templates/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  getModerationReports(status: ModerationStatus | 'All' = 'All', pageNumber = 1, pageSize = 100): Observable<PaginatedResult<ModerationReportDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (status !== 'All') {
      params = params.set('status', status);
    }

    return this.http
      .get<ApiEnvelope<PaginatedResult<ModerationReportDto>>>(`${API_BASE_URL}/admin/moderation/reports`, { params })
      .pipe(map((response) => this.unwrap(response)));
  }

  updateModerationReport(id: string, payload: UpdateModerationReportRequest): Observable<string | null> {
    return this.http
      .patch<ApiEnvelope<string | null>>(`${API_BASE_URL}/admin/moderation/reports/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  resolveModerationReport(id: string, actionTaken: string): Observable<string | null> {
    return this.updateModerationReport(id, { actionTaken, status: 'ActionTaken' });
  }

  getUsers(pageNumber = 1, pageSize = 100, search?: string): Observable<PaginatedResult<UserListItemDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResult<UserListItemDto>>(`${API_BASE_URL}/admin/users`, { params });
  }

  inviteUser(payload: InviteUserRequest): Observable<string | null> {
    return this.http
      .post<ApiEnvelope<string | null>>(`${API_BASE_URL}/admin/users/invite`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  resendInvitation(id: string): Observable<string | null> {
    return this.http
      .post<ApiEnvelope<string | null>>(`${API_BASE_URL}/admin/users/${id}/resend-invitation`, {})
      .pipe(map((response) => this.unwrap(response)));
  }

  changeUserStatus(id: string, payload: ChangeUserStatusRequest): Observable<string | null> {
    return this.http
      .patch<ApiEnvelope<string | null>>(`${API_BASE_URL}/admin/users/${id}/status`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  changeUserRole(id: string, payload: ChangeUserRoleRequest): Observable<string | null> {
    return this.http
      .patch<ApiEnvelope<string | null>>(`${API_BASE_URL}/admin/users/${id}/role`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): Observable<string | null> {
    return this.http
      .patch<ApiEnvelope<string | null>>(
        `${API_BASE_URL}/admin/orders/${orderId}/status`,
        { newStatus },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  assignPrinterToOrderItem(orderItemId: string, printerProfileId: string): Observable<string | null> {
    return this.http
      .patch<ApiEnvelope<string | null>>(
        `${API_BASE_URL}/admin/order-items/${orderItemId}/assign-printer`,
        { printerProfileId }
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  createReportChatSession(): Observable<string> {
    return this.http
      .post<ApiEnvelope<string>>(`${API_BASE_URL}/ReportChat/session`, {})
      .pipe(map((response) => this.unwrap(response)));
  }

  sendReportChatMessage(sessionId: string, message: string): Observable<ReportChatResponseDto> {
    return this.http
      .post<ApiEnvelope<ReportChatResponseDto>>(`${API_BASE_URL}/ReportChat/messages`, { sessionId, message })
      .pipe(map((response) => this.unwrap(response)));
  }

  resolveAssetUrl(url?: string | null): string {
    return resolveApiUrl(url ?? '');
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    if (!response.succeeded) {
      const errors = Array.isArray(response.errors)
        ? response.errors.filter((error): error is string => typeof error === 'string')
        : [];
      throw new Error(errors.join(', ') || response.message || 'The request failed.');
    }

    return response.data;
  }
}
