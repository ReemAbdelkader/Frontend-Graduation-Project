import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/shop.models';

export interface ProfileDto {
  name: string;
  userName: string;
  email: string;
  bio: string | null;
  profilePictureUrl: string | null;
  location: string | null;
  dateJoined: string;
  totalOrdersCount: number;
  itemsPurchasedCount: number;
  totalSpent: number;
  templatesCreatedCount: number;
  avgTemplateRating: number;
  isTopProfile: boolean;
  totalRewardPoints?: number;
  currentRank?: number;
  followersCount?: number;
  followingCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}/api/profiles`;

  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<ProfileDto> {
    return this.http.get<ApiResponse<ProfileDto>>(`${this.apiUrl}/me`).pipe(
      map((response) => {
        if (!response.succeeded || !response.data) {
          throw new Error(response.message || 'Unable to load profile.');
        }

        return response.data;
      }),
    );
  }

  updateProfile(formData: FormData): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/update`, formData);
  }
}
