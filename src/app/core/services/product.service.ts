import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, of } from "rxjs";
import {
  ApiResponse,
  CategoryDto,
  PaginatedResult,
  ProductDto,
  ProductImageDto,
} from "../models/shop.models";
import { environment } from "../../../environments/environment";

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
}
