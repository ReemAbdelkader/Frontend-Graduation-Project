import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, timeout } from 'rxjs';
import { ApiResponse, OrderDto } from '../models/shop.models';
import { environment } from '../../../environments/environment';

export interface CreateOrderItemPayload {
  designId: string;
  quantity: number;
  printerProfileId?: string | null;
}

export interface CreateOrderPayload {
  userId: string;
  receiverName: string;
  phoneNumber: string;
  address: string;
  city: string;
  deliveryNotes?: string | null;
  couponCode?: string | null;
  orderItems: CreateOrderItemPayload[];
}

export interface CreateOrderResult {
  success: boolean;
  checkoutUrl?: string | null;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/api/Orders`;

  constructor(private readonly http: HttpClient) {}

  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResult> {
    return this.http
      .post<unknown>(`${this.apiUrl}/create`, payload)
      .pipe(
        timeout(30000),
        map((response) => this.normalizeCreateOrderResponse(response)),
        catchError((err) => {
          console.error('[OrderService] createOrder error', err);
          const message =
            err?.error?.message ||
            err?.error?.Message ||
            (Array.isArray(err?.error?.errors) ? err.error.errors.join(', ') : null) ||
            (err?.name === 'TimeoutError' ? 'Request timed out. Please check your connection and try again.' : null) ||
            'Could not create order. Please try again.';
          return of({ success: false, message });
        })
      );
  }

  getUserOrders(userId: string): Observable<OrderDto[]> {
    return this.http
      .get<ApiResponse<OrderDto[]>>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        map((response) => response.data ?? []),
        catchError((err) => {
          console.error('[OrderService] getUserOrders error', err);
          return of([]);
        })
      );
  }

  cancelOrder(orderId: string): Observable<boolean> {
    return this.http
      .put<ApiResponse<boolean>>(`${this.apiUrl}/${orderId}/cancel`, {})
      .pipe(
        map((response) => response.data ?? false),
        catchError((err) => {
          console.error('[OrderService] cancelOrder error', err);
          return of(false);
        })
      );
  }

  private normalizeCreateOrderResponse(response: unknown): CreateOrderResult {
    if (typeof response === 'string' && response.trim()) {
      return { success: true, checkoutUrl: response };
    }

    if (typeof response !== 'object' || response === null) {
      return { success: false, message: 'Unexpected server response.' };
    }

    const payload = response as Record<string, unknown>;
    const succeeded = payload['succeeded'] === true || payload['Succeeded'] === true;
    const message = this.extractMessage(payload);
    const data = payload['data'] ?? payload['Data'];

    if (!succeeded) {
      return { success: false, message: message || 'Order could not be created.' };
    }

    if (typeof data === 'string') {
      return { success: true, checkoutUrl: data || null };
    }

    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      const checkoutUrl =
        this.toStringOrNull(dataObj['checkoutUrl']) ||
        this.toStringOrNull(dataObj['CheckoutUrl']) ||
        this.toStringOrNull(dataObj['stripeUrl']) ||
        this.toStringOrNull(dataObj['StripeUrl']) ||
        this.toStringOrNull(dataObj['url']) ||
        this.toStringOrNull(dataObj['Url']);
      return { success: true, checkoutUrl };
    }

    return { success: true };
  }

  private extractMessage(payload: Record<string, unknown>): string | undefined {
    const direct = this.toStringOrNull(payload['message']) || this.toStringOrNull(payload['Message']);
    if (direct) return direct;

    const errors = payload['errors'] ?? payload['Errors'];
    if (Array.isArray(errors)) {
      const messages = errors.filter((e): e is string => typeof e === 'string');
      if (messages.length) return messages.join(', ');
    }

    return undefined;
  }

  private toStringOrNull(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
