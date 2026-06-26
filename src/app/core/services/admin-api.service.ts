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

export interface RecentOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
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

export interface ReportChatResponseDto {
  sessionId: string;
  userMessageId: string;
  aiMessageId: string;
  response: string;
  responseTime: string;
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
      .pipe(map((response) => this.unwrap(response)));
  }

  getCategories(): Observable<CategoryDto[]> {
    return this.http
      .get<ApiEnvelope<CategoryDto[]>>(`${API_BASE_URL}/categories`)
      .pipe(map((response) => this.unwrap(response) ?? []));
  }

  createCategory(payload: CreateCategoryRequest): Observable<ApiEnvelope<CategoryDto>> {
    return this.http.post<ApiEnvelope<CategoryDto>>(`${API_BASE_URL}/categories`, payload);
  }

  updateCategory(id: string, payload: UpdateCategoryRequest): Observable<ApiEnvelope<CategoryDto>> {
    return this.http.put<ApiEnvelope<CategoryDto>>(`${API_BASE_URL}/categories/${id}`, payload);
  }

  deleteCategory(id: string): Observable<ApiEnvelope<string>> {
    return this.http.delete<ApiEnvelope<string>>(`${API_BASE_URL}/categories/${id}`);
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

  createProduct(payload: CreateProductRequest): Observable<ApiEnvelope<ProductDto>> {
    return this.http.post<ApiEnvelope<ProductDto>>(`${API_BASE_URL}/products`, payload);
  }

  updateProduct(id: string, payload: UpdateProductRequest): Observable<ApiEnvelope<ProductDto>> {
    return this.http.put<ApiEnvelope<ProductDto>>(`${API_BASE_URL}/products/${id}`, payload);
  }

  deleteProduct(id: string): Observable<ApiEnvelope<string>> {
    return this.http.delete<ApiEnvelope<string>>(`${API_BASE_URL}/products/${id}`);
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

  resolveModerationReport(id: string, actionTaken: string): Observable<ApiEnvelope<string>> {
    return this.http.patch<ApiEnvelope<string>>(`${API_BASE_URL}/admin/moderation/reports/${id}`, { actionTaken });
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

  inviteUser(payload: InviteUserRequest): Observable<ApiEnvelope<string>> {
    return this.http.post<ApiEnvelope<string>>(`${API_BASE_URL}/admin/users/invite`, payload);
  }

  changeUserStatus(id: string, payload: ChangeUserStatusRequest): Observable<ApiEnvelope<string>> {
    return this.http.patch<ApiEnvelope<string>>(`${API_BASE_URL}/admin/users/${id}/status`, payload);
  }

  changeUserRole(id: string, payload: ChangeUserRoleRequest): Observable<ApiEnvelope<string>> {
    return this.http.patch<ApiEnvelope<string>>(`${API_BASE_URL}/admin/users/${id}/role`, payload);
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): Observable<string> {
    return this.http.put(`${API_BASE_URL}/orders/update-status`, { orderId, newStatus }, { responseType: 'text' });
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
    return response.data;
  }
}
