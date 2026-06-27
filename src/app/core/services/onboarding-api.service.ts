import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './api-config';

export interface SaveOnboardingRequest {
  favoriteColors: string;
  bannedColors?: string;
  styleType?: string;
  interests: string;
  designPreference: string;
}

export interface UserPreferencesResponse {
  favoriteColors: string;
  bannedColors?: string;
  styleType?: string;
  interests: string;
  designPreference: string;
}

interface ApiEnvelope<T> {
  statusCode: number;
  succeeded: boolean;
  message: string | null;
  data: T;
  errors: unknown;
}

@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
  private readonly http = inject(HttpClient);

  getPreferences(): Observable<UserPreferencesResponse> {
    return this.http
      .get<ApiEnvelope<UserPreferencesResponse>>(`${API_BASE_URL}/Identity/onboarding`)
      .pipe(map((res) => res.data));
  }

  saveOnboarding(data: SaveOnboardingRequest): Observable<{ ok: boolean; message: string }> {
    return this.http
      .post<ApiEnvelope<null>>(`${API_BASE_URL}/Identity/onboarding`, data)
      .pipe(
        map((res) => ({
          ok: res.succeeded,
          message: res.message ?? 'Onboarding saved.',
        }))
      );
  }
}