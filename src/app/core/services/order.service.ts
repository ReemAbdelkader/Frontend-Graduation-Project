import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { ApiResponse, OrderDto, OrderDetailItemDto } from '../models/shop.models';
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

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/api/Orders`;

  constructor(private readonly http: HttpClient) {}

  createOrder(payload: CreateOrderPayload): Observable<string | null> {
    return this.http
      .post<ApiResponse<string>>(`${this.apiUrl}/create`, payload)
      .pipe(
        map((response) => response.data ?? null),
        catchError((err) => {
          console.error('[OrderService] createOrder error', err);
          return of(null);
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
}
