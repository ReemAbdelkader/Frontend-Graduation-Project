import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL, resolveApiUrl } from './api-config';
import { map, Observable, tap } from 'rxjs';

export interface ApiEnvelope<T> {
  statusCode: number;
  succeeded: boolean;
  message: string | null;
  data: T;
  errors: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
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
  categoryId: string;
  createdAt: string;
}

export interface TemplateDetailDto extends TemplateDto {
  averageRating: number;
  reviewCount: number;
  likedByCurrentUser?: boolean;
  savedByCurrentUser?: boolean;
  commentCount?: number;
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface ProfileDto {
  userName: string;
  name: string;
  email: string;
  bio: string;
  profilePictureUrl: string;
  location: string;
  dateJoined: string;
  isTopProfile: boolean;
  itemsPurchasedCount: number;
  totalOrdersCount: number;
  totalSpent: number;
  templatesCreatedCount: number;
  avgTemplateRating: number;
  totalRewardPoints: number;
  currentRank: number;
  followersCount: number;
  followingCount: number;
}

export interface CreateTemplateRequest {
  name: string;
  categoryId: string;
  styleTags?: string | null;
  previewImageURL: string;
  isPublic?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TemplatesApiService {
  constructor(private readonly http: HttpClient) {}

  getPublicTemplates(pageNumber = 1, pageSize = 20): Observable<PaginatedResult<TemplateDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http
      .get<ApiEnvelope<PaginatedResult<TemplateDto>>>(`${API_BASE_URL}/templates`, { params })
      .pipe(map((response) => response.data));
  }

  getTemplate(id: string): Observable<TemplateDetailDto> {
    return this.http
      .get<ApiEnvelope<TemplateDetailDto>>(`${API_BASE_URL}/templates/${id}`)
      .pipe(map((response) => response.data));
  }

  getCategories(): Observable<CategoryDto[]> {
    return this.http
      .get<ApiEnvelope<CategoryDto[]>>(`${API_BASE_URL}/categories`)
      .pipe(map((response) => response.data));
  }

  getProfile(userId: string): Observable<ProfileDto> {
    const params = new HttpParams().set('userId', userId);

    return this.http
      .get<ApiEnvelope<ProfileDto>>(`${API_BASE_URL}/profiles/me`, { params })
      .pipe(map((response) => response.data));
  }

  createTemplate(payload: CreateTemplateRequest): Observable<TemplateDto> {
    return this.http
      .post<ApiEnvelope<TemplateDto>>(`${API_BASE_URL}/templates`, payload)
      .pipe(map((response) => response.data));
  }

  generateTemplate(productId: string): Observable<TemplateDto> {
    return this.http
      .post<ApiEnvelope<TemplateDto>>(`${API_BASE_URL}/templates/generate`, { productId })
      .pipe(map((response) => response.data));
  }

  /**
   * Generates 3 personalized AI templates based on the user's
   * onboarding preferences. Called right after onboarding completes.
   */
 generateOnboardingTemplates(): Observable<TemplateDto[]> {
    return this.http
      .post<ApiEnvelope<TemplateDto[]>>(`${API_BASE_URL}/templates/generate-onboarding`, {})
      .pipe(
        tap((response) => console.log('[generateOnboardingTemplates] raw response:', response)),
        map((response) => {
          if (!response.succeeded) {
            throw new Error(response.message ?? 'Template generation failed on the server');
          }
          return response.data;
        })
      );
  }

  /**
   * Gets the current user's own templates (including AI-generated ones).
   */
  getMyTemplates(pageNumber = 1, pageSize = 20): Observable<PaginatedResult<TemplateDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http
      .get<ApiEnvelope<PaginatedResult<TemplateDto>>>(`${API_BASE_URL}/templates/mine`, { params })
      .pipe(map((response) => response.data));
  }

  resolvePreviewUrl(url: string): string {
    return resolveApiUrl(url);
  }
}