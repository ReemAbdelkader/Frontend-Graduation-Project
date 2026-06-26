import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, of } from "rxjs";
import { ApiResponse, OrderDto } from "../models/shop.models";
import { environment } from "../../../environments/environment";

export interface OrderCreatePayload {
  productName: string;
  productImage: string;
  amount: number;
  cardHolderName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}
export interface OrderCreateResponse {
  success: boolean;
  order: OrderDto;
  notification: any; 
}

@Injectable({ providedIn: "root" })
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/api/orders`; 

  constructor(private readonly http: HttpClient) {}

  createOrder(payload: OrderCreatePayload): Observable<OrderCreateResponse | null> {
    return this.http
      .post<ApiResponse<OrderCreateResponse>>(this.apiUrl, payload)
      .pipe(
        map((response) => response.data ?? null),
        catchError(() => of(null))
      );
  }

  getUserOrders(): Observable<OrderDto[]> {
    return this.http
      .get<ApiResponse<OrderDto[]>>(`${this.apiUrl}/my-orders`)
      .pipe(
        map((response) => response.data ?? []),
        catchError(() => of([]))
      );
  }
}