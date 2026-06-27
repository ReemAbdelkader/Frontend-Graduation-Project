import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, of, throwError } from "rxjs";

import {
  AddToCartPayload,
  ApiResponse,
  CartDto,
  CartItemDto,
  CategoryDto,
  PaginatedResult,
  ProductDto,
  ProductImageDto,
} from "../models/shop.models";
import { environment } from "../../../environments/environment";

interface DesignCreatePayload {
  id?: string | null;
  userId?: string | null;
  productId: string;
  templateId?: string | null;
  canvasStateJSON: string;
  base64Snapshot?: string | null;
  base64Front?: string | null;
  base64Back?: string | null;
  selectedSize?: number | null;
  selectedFabric?: number | null;
  selectedPrintMethod?: number | null;
  selectedColor?: string | null;
}

interface DesignResponsePayload {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  templateId?: string | null;
  canvasStateJSON: string;
  snapshotImageURL: string;
  status: string;
  selectedSize?: string | null;
  selectedFabric?: string | null;
  selectedPrintMethod?: string | null;
  selectedColor?: string | null;
  calculatedPrice?: number;
}

@Injectable({ providedIn: "root" })
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  getProducts(
    pageNumber = 1,
    pageSize = 20,
    categoryId?: string,
  ): Observable<PaginatedResult<ProductDto>> {
    let params = new HttpParams()
      .set("pageNumber", String(pageNumber))
      .set("pageSize", String(pageSize));

    if (categoryId) {
      params = params.set("categoryId", categoryId);
    }

    return this.http
      .get<ApiResponse<PaginatedResult<ProductDto>>>("/api/products", {
        params,
      })
      .pipe(
        map(
          (response) =>
            response.data ?? {
              data: [],
              currentPage: 1,
              totalPages: 0,
              totalCount: 0,
              pageSize,
              hasPreviousPage: false,
              hasNextPage: false,
              succeeded: false,
            },
        ),
        catchError(() =>
          of({
            data: [],
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            pageSize,
            hasPreviousPage: false,
            hasNextPage: false,
            succeeded: false,
          }),
        ),
      );
  }

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<ApiResponse<CategoryDto[]>>("/api/categories").pipe(
      map((response) => response.data ?? []),
      catchError(() => of([])),
    );
  }

  getProductById(id: string): Observable<ProductDto | null> {
    return this.http.get<ApiResponse<ProductDto>>(`/api/products/${id}`).pipe(
      map((response) => response.data ?? null),
      catchError(() => of(null)),
    );
  }

  getProductImages(productId: string): Observable<ProductImageDto[]> {
    return this.http
      .get<
        ApiResponse<ProductImageDto[]>
      >(`${this.apiUrl}/products/${productId}/images`)
      .pipe(
        map((response) => response.data ?? []),
        catchError(() => of([])),
      );
  }

  uploadDesignSnapshot(file: File): Observable<string | null> {
    const formData = new FormData();
    formData.append("file", file);

    return this.http
      .post(`${this.apiUrl}/designstudio/upload-snapshot`, formData, {
        responseType: "text",
      })
      .pipe(
        map((response) => (response ? response : null)),
        catchError(() => of(null)),
      );
  }

  createDesign(payload: DesignCreatePayload): Observable<string | null> {
    return this.http
      .post<string>(`${this.apiUrl}/designstudio`, payload)
      .pipe(
        map((response) => (response ? String(response) : null)),
        catchError((err) => {
          console.error('[ProductService] createDesign failed', err);
          return throwError(() => err);
        }),
      );
  }

  getDesignById(id: string): Observable<DesignResponsePayload | null> {
    return this.http
      .get<DesignResponsePayload>(`${this.apiUrl}/designstudio/${id}`)
      .pipe(
        map((response) => response ?? null),
        catchError(() => of(null)),
      );
  }

  addToCart(payload: AddToCartPayload): Observable<CartDto> {
    return this.http
      .post<{ data: CartDto }>(`${this.apiUrl}/cart/items`, payload)
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('[ProductService] addToCart failed', err);
          return throwError(() => err);
        }),
      );
  }
}