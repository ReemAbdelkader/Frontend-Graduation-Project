import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/shop.models';

export interface ProfileDto {
  name: string;
  userName: string;
  email: string;
  bio: string;
  profilePictureUrl: string;
  totalOrdersCount: number;
  itemsPurchasedCount: number;
  totalSpent: number;
  templatesCreatedCount: number;
  avgTemplateRating: number;
  followersCount: number;
  followingCount: number;
  isTopProfile?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}/api/profiles`;

  constructor(private readonly http: HttpClient) {}

  getProfile(email: string): Observable<ProfileDto | null> {
    const params = new HttpParams().set('email', email); 
    return this.http.get<ApiResponse<ProfileDto>>(`${this.apiUrl}/me`, { params }).pipe(
      map(response => response.succeeded ? response.data : null),
      catchError(() => of(null))
    );
  }

  updateProfile(formData: FormData): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/update`, formData).pipe(
      catchError((err) => {
        return of({ 
          succeeded: false, 
          message: err.error?.message || err.message || 'Error updating profile', 
          data: '' 
        });
      })
    );
  }
}