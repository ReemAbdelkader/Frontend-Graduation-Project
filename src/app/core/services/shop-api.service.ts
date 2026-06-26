import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL, resolveApiUrl } from './api-config';
import { ApiEnvelope, CategoryDto, PaginatedResult } from './templates-api.service';

export interface ProductDto {
  id: string;
  name: string;
  basePrice: number;
  categoryName: string;
  previewImageUrl: string;
  isAvailable: boolean;
  averageRating: number;
  reviewCount?: number;
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

@Injectable({ providedIn: 'root' })
export class ShopApiService {
  constructor(private readonly http: HttpClient) {}

  getProducts(
    pageNumber = 1,
    pageSize = 12,
    categoryId?: string | null
  ): Observable<PaginatedResult<ProductDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }

    return this.http
      .get<ApiEnvelope<PaginatedResult<ProductDto>>>(`${API_BASE_URL}/products`, { params })
      .pipe(map((response) => response.data));
  }

  getProduct(id: string): Observable<ProductDto> {
    return this.http
      .get<ApiEnvelope<ProductDto>>(`${API_BASE_URL}/products/${id}`)
      .pipe(map((response) => response.data));
  }

  getProductImages(id: string): Observable<ProductImageDto[]> {
    return this.http
      .get<ApiEnvelope<ProductImageDto[]>>(`${API_BASE_URL}/products/${id}/images`)
      .pipe(map((response) => response.data));
  }

  getCategories(): Observable<CategoryDto[]> {
    return this.http
      .get<ApiEnvelope<CategoryDto[]>>(`${API_BASE_URL}/categories`)
      .pipe(map((response) => response.data));
  }

  resolveImageUrl(url: string): string {
    return resolveApiUrl(url);
  }
}
