import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL, resolveApiUrl } from './api-config';
import { ApiEnvelope, PaginatedResult } from './templates-api.service';

export interface CommunityFeedItemDto {
  id: string;
  name: string;
  previewImageURL: string;
  styleTags: string | null;
  likesCount: number;
  remixesCount: number;
  commentCount: number;
  averageRating: number;
  creatorUserId: string;
  creatorName: string;
  creatorProfileImageUrl: string | null;
  createdAt: string;
  // Optional flags populated by the backend when available
  likedByCurrentUser?: boolean;
  savedByCurrentUser?: boolean;
}

export interface CommunityFeedData extends PaginatedResult<CommunityFeedItemDto> {}
export type CommunityFeedResponse = ApiEnvelope<CommunityFeedData>;

export interface CommunityTopCreatorDto {
  userId: string;
  userName: string;
  profileImageUrl: string | null;
  totalLikes: number;
  totalRemixes: number;
  templateCount: number;
}

export type CommunityTopCreatorsResponse = ApiEnvelope<CommunityTopCreatorDto[]>;

export interface LikeStatusDto {
  liked: boolean;
  count: number;
}

export interface SaveStatusDto {
  saved: boolean;
}

export interface CommunityCommentDto {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userProfileImageUrl: string | null;
  createdAt: string;
  isOwner: boolean;
}

export type CommunityCommentsResponse = ApiEnvelope<PaginatedResult<CommunityCommentDto>>;
export type CommunityCommentResponse = ApiEnvelope<CommunityCommentDto>;
export type CommunityLikeResponse = ApiEnvelope<LikeStatusDto>;
export type CommunitySaveResponse = ApiEnvelope<SaveStatusDto>;
export type CommunityActionResponse = ApiEnvelope<null>;

@Injectable({ providedIn: 'root' })
export class CommunityApiService {
  constructor(private readonly http: HttpClient) {}

  getCommunityFeed(
    pageNumber = 1,
    pageSize = 10,
    filter: 'new' | 'default' = 'default'
  ): Observable<CommunityFeedData> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('filter', filter);

    return this.http
      .get<CommunityFeedResponse>(`${API_BASE_URL}/community/feed`, { params })
      .pipe(
        map((response) => {
          if (!response.succeeded) {
            throw new Error(response.message ?? 'Failed to load community feed.');
          }
          return response.data;
        })
      );
  }

  getTopCreators(count = 5): Observable<CommunityTopCreatorDto[]> {
    const params = new HttpParams().set('count', count.toString());

    return this.http
      .get<CommunityTopCreatorsResponse>(`${API_BASE_URL}/community/top-creators`, { params })
      .pipe(
        map((response) => {
          if (!response.succeeded) {
            throw new Error(response.message ?? 'Failed to load top creators.');
          }
          return response.data;
        })
      );
  }

  likeTemplate(templateId: string): Observable<LikeStatusDto> {
    return this.http
      .post<CommunityLikeResponse>(`${API_BASE_URL}/community/templates/${templateId}/like`, {})
      .pipe(
        map((response) => {
          if (!response.succeeded) {
            throw new Error(response.message ?? 'Unable to like template.');
          }
          return response.data;
        })
      );
  }

  saveTemplate(templateId: string): Observable<SaveStatusDto> {
    return this.http
      .post<CommunitySaveResponse>(`${API_BASE_URL}/community/templates/${templateId}/save`, {})
      .pipe(
        map((response) => {
          if (!response.succeeded) {
            throw new Error(response.message ?? 'Unable to save template.');
          }
          return response.data;
        })
      );
  }

  getTemplateComments(templateId: string): Observable<CommunityCommentDto[]> {
    return this.http
      .get<CommunityCommentsResponse>(`${API_BASE_URL}/community/templates/${templateId}/comments`)
      .pipe(
        map((response) => {
          if (!response.succeeded) {
            throw new Error(response.message ?? 'Unable to load comments.');
          }
          return response.data.data;
        })
      );
  }

  postTemplateComment(templateId: string, content: string): Observable<CommunityCommentDto> {
    return this.http
      .post<CommunityCommentResponse>(`${API_BASE_URL}/community/templates/${templateId}/comments`, {
        content,
      })
      .pipe(
        map((response) => {
          if (!response.succeeded) {
            throw new Error(response.message ?? 'Unable to post comment.');
          }
          return response.data;
        })
      );
  }

  deleteTemplateComment(templateId: string, commentId: string): Observable<void> {
    return this.http
      .delete<CommunityActionResponse>(
        `${API_BASE_URL}/community/comments/${commentId}`
      )
      .pipe(
        map((response) => {
          if (!response.succeeded) {
            throw new Error(response.message ?? 'Unable to delete comment.');
          }
        })
      );
  }

  reportTemplate(templateId: string, reason: string): Observable<void> {
    return this.http
      .post<CommunityActionResponse>(
        `${API_BASE_URL}/community/templates/${templateId}/report`,
        { reason }
      )
      .pipe(
        map((response) => {
          if (!response.succeeded) {
            throw new Error(response.message ?? 'Unable to report template.');
          }
        })
      );
  }

  resolvePreviewUrl(url: string): string {
    return resolveApiUrl(url);
  }
}
