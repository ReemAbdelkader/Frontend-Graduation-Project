import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/shop.models';

export enum RewardType {
  FinancialDiscount = 1,
  FreeProduct = 2,
  Badge = 3
}

export interface Reward {
  id: string;
  userId: string;
  templateId: string | null;
  rewardRuleId: string;
  rewardType: RewardType;
  rewardValue: number;
  isClaimed: boolean;
  badgeImageUrl: string | null;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RewardsService {
  private readonly apiUrl = `${environment.apiUrl}/api/Rewards`;

  constructor(private readonly http: HttpClient) {}

  getUserRewards(userId: string): Observable<Reward[]> {
    return this.http.get<ApiResponse<Reward[]>>(`${this.apiUrl}/user/${userId}`).pipe(
      map((response) => {
        if (!response.succeeded || !response.data) {
          throw new Error(response.message || 'Unable to load rewards.');
        }
        return response.data;
      })
    );
  }
}
