import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { API_BASE_URL, resolveApiUrl } from './api-config';
import { ApiEnvelope, PaginatedResult, TemplateDto } from './templates-api.service';

export interface DesignResponseDto {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  templateId: string | null;
  canvasStateJSON: string;
  snapshotImageURL: string;
  status: string;
  selectedSize: string | null;
  selectedFabric: string | null;
  selectedPrintMethod: string | null;
  selectedColor: string | null;
  calculatedPrice: number;
}

export interface OrderListDto {
  orderId: string;
  orderNumber: string;
  placedDate: string;
  estimatedDeliveryDate: string;
  orderStatus: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  trackingNumber: string | null;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: number | string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  constructor(private readonly http: HttpClient) {}

  getDesigns(): Observable<DesignResponseDto[]> {
    return this.http
      .get<DesignResponseDto[] | ApiEnvelope<DesignResponseDto[]>>(`${API_BASE_URL}/DesignStudio/user`)
      .pipe(map((response) => this.unwrapArray(response)));
  }

  getOrders(userId: string): Observable<OrderListDto[]> {
    return this.http
      .get<ApiEnvelope<OrderListDto[]>>(`${API_BASE_URL}/Orders/user/${userId}`)
      .pipe(map((response) => response.data ?? []));
  }

  getNotifications(): Observable<NotificationDto[]> {
    return this.http
      .get<ApiEnvelope<NotificationDto[]> | NotificationDto[]>(`${API_BASE_URL}/Notifications`)
      .pipe(map((response) => this.unwrapArray(response)));
  }

  getAllMyTemplates(pageSize = 100): Observable<TemplateDto[]> {
    return this.getMyTemplatesPage(1, pageSize).pipe(
      expand((page) => (page.hasNextPage ? this.getMyTemplatesPage(page.currentPage + 1, pageSize) : EMPTY)),
      reduce<PaginatedResult<TemplateDto>, TemplateDto[]>((items, page) => {
        if (page?.data?.length) {
          items.push(...page.data);
        }
        return items;
      }, []),
    );
  }

  resolveAssetUrl(url?: string | null): string {
    return resolveApiUrl(url ?? '');
  }

  private getMyTemplatesPage(pageNumber: number, pageSize: number): Observable<PaginatedResult<TemplateDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http
      .get<ApiEnvelope<PaginatedResult<TemplateDto>>>(`${API_BASE_URL}/templates/mine`, { params })
      .pipe(map((response) => response.data));
  }

  private unwrapArray<T>(response: T[] | ApiEnvelope<T[]>): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return Array.isArray(response?.data) ? response.data : [];
  }
}
