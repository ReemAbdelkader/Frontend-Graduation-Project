import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { extractAdminApiError } from './admin-api.service';
import { AuthService } from './auth.service';
import { API_BASE_URL } from './api-config';
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

export interface PrinterProfileDto {
  id: string;
  userId?: string;
  supportedFabrics: number;
  supportedPrintMethods: number;
  printerName?: string;
  isActive?: boolean;
}

export interface CreatePrinterProfilePayload {
  supportedFabrics: number;
  supportedPrintMethods: number;
}

export interface PrinterProfileSummaryDto {
  totalAssignedItems?: number;
  pendingItems?: number;
  completedItems?: number;
  totalOrderItems?: number;
  pendingOrderItems?: number;
  assignedToPrinterOrderItems?: number;
  inProductionOrderItems?: number;
  readyOrderItems?: number;
  shippedOrderItems?: number;
  totalOrders?: number;
  pendingOrders?: number;
  printingOrders?: number;
  completedOrders?: number;
}

export interface PrinterDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  printingOrders: number;
  completedOrders: number;
}

export interface PrinterMutationResult {
  success: boolean;
  message?: string;
  data?: PrinterProfileDto | null;
}

export interface PrinterFlagOption {
  label: string;
  value: number;
}

export const PRINTER_FABRIC_OPTIONS: PrinterFlagOption[] = [
  { label: 'Cotton', value: 1 },
  { label: 'Polyester', value: 2 },
  { label: 'Wool', value: 4 },
  { label: 'Silk', value: 8 },
  { label: 'Linen', value: 16 },
];

export const PRINTER_PRINT_METHOD_OPTIONS: PrinterFlagOption[] = [
  { label: 'Direct to Garment', value: 1 },
  { label: 'Screen Printing', value: 2 },
  { label: 'Heat Transfer', value: 4 },
  { label: 'Sublimation', value: 8 },
  { label: 'Embroidery', value: 16 },
];

export const PRINTER_ORDER_ITEM_STATUSES: PrinterOrderItemStatus[] = [
  'Pending',
  'AssignedToPrinter',
  'InProduction',
  'Ready',
  'Shipped',
];

const ORDER_ITEM_STATUS_BY_NUMBER: Record<number, PrinterOrderItemStatus> = {
  1: 'Pending',
  2: 'AssignedToPrinter',
  3: 'InProduction',
  4: 'Ready',
  5: 'Shipped',
};

@Injectable({ providedIn: 'root' })
export class PrinterService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${API_BASE_URL}/printer`;
  private readonly profilesUrl = `${API_BASE_URL}/PrinterProfiles`;

  getMyOrderItems(pageNumber = 1, pageSize = 50, status?: string): Observable<PaginatedResult<PrinterOrderItemDto>> {
    let params = `?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (status) params += `&status=${status}`;

    return this.http
      .get<PaginatedResult<PrinterOrderItemDto>>(`${this.apiUrl}/order-items${params}`)
      .pipe(
        map((result) => {
          const normalized = this.normalizePaginatedResult(result);
          return {
            ...normalized,
            data: normalized.data
              .map((item) => this.normalizeOrderItem(item))
              .filter((item): item is PrinterOrderItemDto => item !== null),
          };
        }),
        catchError((err) => {
          console.error('[PrinterService] getMyOrderItems error', err);
          return of({
            data: [],
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            pageSize,
            hasPreviousPage: false,
            hasNextPage: false,
            succeeded: false,
          } as PaginatedResult<PrinterOrderItemDto>);
        }),
      );
  }

  updateOrderItemStatus(id: string, newStatus: PrinterOrderItemStatus): Observable<ApiResponse<PrinterOrderItemDto> | null> {
    return this.http
      .patch<ApiResponse<PrinterOrderItemDto>>(`${this.apiUrl}/order-items/${id}/status`, { newStatus })
      .pipe(
        catchError((err) => {
          console.error('[PrinterService] updateOrderItemStatus error', err);
          return of(null);
        }),
      );
  }

  getProfileSummary(): Observable<PrinterDashboardStats | null> {
    return this.http
      .get<ApiResponse<PrinterProfileSummaryDto> | PrinterProfileSummaryDto>(`${this.apiUrl}/profile/summary`)
      .pipe(
        map((response) => this.normalizeDashboardStats(this.unwrapApiData(response))),
        catchError((err) => {
          console.error('[PrinterService] getProfileSummary error', err);
          return of(null);
        }),
      );
  }

  getDashboardStats(): Observable<PrinterDashboardStats> {
    return this.getProfileSummary().pipe(
      map((summary) => {
        if (summary) return summary;
        return { totalOrders: 0, pendingOrders: 0, printingOrders: 0, completedOrders: 0 };
      }),
    );
  }

  getPrinterProfiles(pageNumber = 1, pageSize = 100): Observable<PaginatedResult<PrinterProfileDto>> {
    return this.http
      .get<PaginatedResult<PrinterProfileDto> | Record<string, unknown>>(
        `${this.profilesUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      )
      .pipe(
        map((response) => this.normalizePaginatedProfiles(response)),
        catchError((err) => {
          console.error('[PrinterService] getPrinterProfiles error', err);
          return of({
            data: [],
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            pageSize,
            hasPreviousPage: false,
            hasNextPage: false,
            succeeded: false,
          } as PaginatedResult<PrinterProfileDto>);
        }),
      );
  }

  getMyPrinterProfile(): Observable<PrinterProfileDto | null> {
    const userId = this.authService.userId();

    return this.getPrinterProfiles(1, 100).pipe(
      map((result) => {
        const profiles = result.data ?? [];
        if (!profiles.length) return null;

        if (userId) {
          const mine = profiles.find((profile) => profile.userId === userId);
          if (mine) return mine;
        }

        return profiles.length === 1 ? profiles[0] : null;
      }),
    );
  }

  savePrinterProfile(payload: CreatePrinterProfilePayload): Observable<PrinterMutationResult> {
    return this.http.post<unknown>(this.profilesUrl, payload).pipe(
      map((response) => this.normalizeMutationResponse(response, 'Printer profile saved.')),
      catchError((err) => {
        console.error('[PrinterService] savePrinterProfile error', err);
        return of({
          success: false,
          message: extractAdminApiError(err, 'Failed to save printer profile.'),
        });
      }),
    );
  }

  isFlagSelected(mask: number, value: number): boolean {
    return (mask & value) === value;
  }

  toggleFlag(mask: number, value: number, checked: boolean): number {
    return checked ? mask | value : mask & ~value;
  }

  normalizeOrderItemStatus(status: string | number | null | undefined): string {
    if (typeof status === 'number') {
      return ORDER_ITEM_STATUS_BY_NUMBER[status] ?? String(status);
    }

    if (typeof status === 'string' && status.trim()) {
      return status;
    }

    return 'Pending';
  }

  private normalizePaginatedProfiles(response: PaginatedResult<PrinterProfileDto> | Record<string, unknown>): PaginatedResult<PrinterProfileDto> {
    const paginated = this.normalizePaginatedResult(response);
    return {
      ...paginated,
      data: paginated.data
        .map((item) => this.normalizePrinterProfile(item))
        .filter((item): item is PrinterProfileDto => item !== null),
    };
  }

  private normalizePrinterProfile(raw: unknown): PrinterProfileDto | null {
    if (!raw || typeof raw !== 'object') return null;

    const profile = raw as Record<string, unknown>;
    const id = this.toStringOrNull(profile['id'] ?? profile['Id']);
    if (!id) return null;

    return {
      id,
      userId: this.toStringOrNull(profile['userId'] ?? profile['UserId']) ?? undefined,
      supportedFabrics: Number(profile['supportedFabrics'] ?? profile['SupportedFabrics'] ?? 0),
      supportedPrintMethods: Number(profile['supportedPrintMethods'] ?? profile['SupportedPrintMethods'] ?? 0),
      printerName: this.toStringOrNull(profile['printerName'] ?? profile['PrinterName']) ?? undefined,
      isActive: profile['isActive'] !== false && profile['IsActive'] !== false,
    };
  }

  private normalizeOrderItem(raw: unknown): PrinterOrderItemDto | null {
    if (!raw || typeof raw !== 'object') return null;

    const item = raw as Record<string, unknown>;
    const id = this.toStringOrNull(item['id'] ?? item['Id']);
    if (!id) return null;

    return {
      id,
      orderId: this.toStringOrNull(item['orderId'] ?? item['OrderId']) ?? '',
      orderNumber: this.toStringOrNull(item['orderNumber'] ?? item['OrderNumber']) ?? '',
      designSnapshotUrl: this.toStringOrNull(
        item['designSnapshotUrl'] ?? item['DesignSnapshotUrl'] ?? item['snapshotImageURL'] ?? item['SnapshotImageURL'],
      ) ?? '',
      quantity: Number(item['quantity'] ?? item['Quantity'] ?? 0),
      status: this.normalizeOrderItemStatus(
        (item['status'] ?? item['Status']) as string | number | null | undefined,
      ),
    };
  }

  private normalizePaginatedResult<T>(response: PaginatedResult<T> | Record<string, unknown>): PaginatedResult<T> {
    const payload = response as Record<string, unknown>;
    const rawData = payload['data'] ?? payload['Data'];
    const data = Array.isArray(rawData) ? rawData as T[] : [];

    return {
      data,
      currentPage: Number(payload['currentPage'] ?? payload['CurrentPage'] ?? 1),
      totalPages: Number(payload['totalPages'] ?? payload['TotalPages'] ?? 0),
      totalCount: Number(payload['totalCount'] ?? payload['TotalCount'] ?? data.length),
      pageSize: Number(payload['pageSize'] ?? payload['PageSize'] ?? data.length),
      hasPreviousPage: Boolean(payload['hasPreviousPage'] ?? payload['HasPreviousPage'] ?? false),
      hasNextPage: Boolean(payload['hasNextPage'] ?? payload['HasNextPage'] ?? false),
      succeeded: payload['succeeded'] !== false && payload['Succeeded'] !== false,
    };
  }

  private normalizeMutationResponse(response: unknown, successMessage: string): PrinterMutationResult {
    if (response === null || response === undefined || response === '') {
      return { success: true, message: successMessage };
    }

    if (typeof response === 'string' && response.trim()) {
      return {
        success: true,
        message: successMessage,
        data: { id: response.trim(), supportedFabrics: 0, supportedPrintMethods: 0 },
      };
    }

    if (typeof response !== 'object') {
      return { success: false, message: 'Unexpected server response.' };
    }

    const payload = response as Record<string, unknown>;
    const succeeded = payload['succeeded'] === true || payload['Succeeded'] === true;
    const message = this.extractMessage(payload);
    const rawData = payload['data'] ?? payload['Data'];
    const data = this.normalizePrinterProfile(rawData)
      ?? (typeof rawData === 'string'
        ? { id: rawData, supportedFabrics: 0, supportedPrintMethods: 0 }
        : null);

    if (succeeded) {
      return { success: true, message: message || successMessage, data };
    }

    if (data) {
      return { success: true, message: message || successMessage, data };
    }

    return {
      success: false,
      message: message || 'Failed to save printer profile.',
    };
  }

  private unwrapApiData<T>(response: ApiResponse<T> | T): T | null {
    if (response && typeof response === 'object' && ('succeeded' in response || 'Succeeded' in response)) {
      const wrapped = response as ApiResponse<T> & Record<string, unknown>;
      const succeeded = wrapped.succeeded === true || wrapped['Succeeded'] === true;
      if (!succeeded) return null;
      return (wrapped.data ?? wrapped['Data'] ?? null) as T | null;
    }

    return (response as T) ?? null;
  }

  private normalizeDashboardStats(data: PrinterProfileSummaryDto | null): PrinterDashboardStats | null {
    if (!data) return null;

    const totalOrders = this.pickCount(data, ['totalAssignedItems', 'totalOrderItems', 'totalOrders']);
    const pendingOrders = this.pickCount(data, ['pendingItems', 'pendingOrderItems', 'pendingOrders'])
      + this.pickCount(data, ['assignedToPrinterOrderItems']);
    const printingOrders = this.pickCount(data, ['inProductionOrderItems', 'printingOrders']);
    const completedOrders = this.pickCount(data, ['completedItems', 'completedOrders'])
      || this.pickCount(data, ['readyOrderItems']) + this.pickCount(data, ['shippedOrderItems']);

    if (!totalOrders && !pendingOrders && !printingOrders && !completedOrders) {
      return null;
    }

    return {
      totalOrders: totalOrders || pendingOrders + printingOrders + completedOrders,
      pendingOrders,
      printingOrders,
      completedOrders,
    };
  }

  private pickCount(data: PrinterProfileSummaryDto, keys: (keyof PrinterProfileSummaryDto)[]): number {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
      }
    }

    return 0;
  }

  private extractMessage(payload: Record<string, unknown>): string | undefined {
    const direct = this.toStringOrNull(payload['message']) || this.toStringOrNull(payload['Message']);
    if (direct) return direct;

    const errors = payload['errors'] ?? payload['Errors'];
    if (Array.isArray(errors)) {
      const messages = errors.filter((value): value is string => typeof value === 'string');
      if (messages.length) return messages.join(', ');
    } else if (errors && typeof errors === 'object') {
      const messages = Object.values(errors)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter((value): value is string => typeof value === 'string');
      if (messages.length) return messages.join(', ');
    }

    return undefined;
  }

  private toStringOrNull(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
