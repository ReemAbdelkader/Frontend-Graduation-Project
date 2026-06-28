import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../models/shop.models';

export interface PrinterOrderItemDto {
  id: string;
  orderId: string;
  orderNumber: string;
  designSnapshotUrl: string;
  quantity: number;
  status: string;
}

export type PrinterOrderItemStatus = 'Pending' | 'AssignedToPrinter' | 'InProduction' | 'Ready' | 'Shipped';

@Injectable({ providedIn: 'root' })
export class PrinterService {
  private readonly apiUrl = `${environment.apiUrl}/api/printer`;

  constructor(private readonly http: HttpClient) {}

  getMyOrderItems(pageNumber = 1, pageSize = 50, status?: string): Observable<PaginatedResult<PrinterOrderItemDto>> {
    let params = `?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (status) params += `&status=${status}`;

    return this.http
      .get<PaginatedResult<PrinterOrderItemDto>>(`${this.apiUrl}/order-items${params}`)
      .pipe(
        catchError((err) => {
          console.error('[PrinterService] getMyOrderItems error', err);
          return of({ data: [], currentPage: 1, totalPages: 0, totalCount: 0, pageSize, hasPreviousPage: false, hasNextPage: false, succeeded: false } as PaginatedResult<PrinterOrderItemDto>);
        })
      );
  }

  updateOrderItemStatus(id: string, newStatus: PrinterOrderItemStatus): Observable<ApiResponse<PrinterOrderItemDto> | null> {
    return this.http
      .patch<ApiResponse<PrinterOrderItemDto>>(`${this.apiUrl}/order-items/${id}/status`, { newStatus })
      .pipe(
        catchError((err) => {
          console.error('[PrinterService] updateOrderItemStatus error', err);
          return of(null);
        })
      );
  }
}