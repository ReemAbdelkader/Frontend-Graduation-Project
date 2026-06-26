import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationApiItem {
  id?: number | string;
  notificationId?: number | string;
  title?: string;
  message?: string;
  body?: string;
  content?: string;
  createdAt?: string;
  createdOn?: string;
  createdDate?: string;
  date?: string;
  readAt?: string | null;
  isRead?: boolean;
  read?: boolean;
  unread?: boolean;
  isUnread?: boolean;
  destination?: string | { path?: string; route?: string; url?: string; target?: string } | null;
  route?: string | { path?: string; route?: string; url?: string; target?: string } | null;
  url?: string;
  targetUrl?: string;
  link?: string;
  href?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  createdAt?: string;
  time: string;
  unread: boolean;
  destination?: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/Notifications`;

  getAll(): Observable<NotificationItem[]> {
    return this.http.get<NotificationApiItem[] | { data: NotificationApiItem[] }>(this.baseUrl).pipe(
      map((response) => this.normalizeNotifications(this.extractItems(response))),
      catchError(() => of([])),
    );
  }

  getUnread(): Observable<NotificationItem[]> {
    return this.http.get<NotificationApiItem[] | { data: NotificationApiItem[] }>(`${this.baseUrl}/unread`).pipe(
      map((response) => this.normalizeNotifications(this.extractItems(response))),
      catchError(() => of([])),
    );
  }

  markAsRead(id: number): Observable<boolean> {
    return this.http.put(`${this.baseUrl}/${id}/read`, {}).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  markAllAsRead(): Observable<boolean> {
    return this.http.put(`${this.baseUrl}/read-all`, {}).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  private extractItems(response: NotificationApiItem[] | { data: NotificationApiItem[] } | null | undefined): NotificationApiItem[] {
    if (Array.isArray(response)) {
      return response;
    }

    return Array.isArray(response?.data) ? response.data : [];
  }

  private normalizeNotifications(items: NotificationApiItem[]): NotificationItem[] {
    return items.map((item, index) => {
      const id = Number(item.id ?? item.notificationId ?? index + 1) || index + 1;
      const title = item.title?.trim() || 'Notification';
      const message = item.message?.trim() || item.body?.trim() || item.content?.trim() || 'You have a new update.';
      const createdAt = item.createdAt ?? item.createdOn ?? item.createdDate ?? item.date;
      const unread = this.isUnread(item);

      return {
        id,
        title,
        message,
        createdAt,
        time: this.toRelativeTime(createdAt),
        unread,
        destination: this.extractDestination(item),
      };
    });
  }

  private isUnread(item: NotificationApiItem): boolean {
    if (item.isRead === true || item.read === true) {
      return false;
    }

    if (item.isRead === false || item.read === false || item.unread === true || item.isUnread === true) {
      return true;
    }

    return false;
  }

  private extractDestination(item: NotificationApiItem): string | null {
    const candidates = [item.destination, item.route, item.url, item.targetUrl, item.link, item.href];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      if (typeof candidate === 'string') {
        return this.normalizeDestination(candidate);
      }

      if (typeof candidate === 'object') {
        const nested = candidate.path ?? candidate.route ?? candidate.url ?? candidate.target;
        if (typeof nested === 'string') {
          return this.normalizeDestination(nested);
        }
      }
    }

    return null;
  }

  private normalizeDestination(value: string): string | null {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    if (/^https?:\/\//i.test(normalized)) {
      return normalized;
    }

    if (normalized.startsWith('/')) {
      return normalized;
    }

    const lower = normalized.toLowerCase();
    if (lower.includes('order')) {
      return '/orders';
    }
    if (lower.includes('community')) {
      return '/community';
    }
    if (lower.includes('design') || lower.includes('studio')) {
      return '/studio';
    }
    if (lower.includes('profile')) {
      return '/profile';
    }
    if (lower.includes('template')) {
      return '/templates';
    }
    if (lower.includes('shop') || lower.includes('product')) {
      return '/shop';
    }
    if (lower.includes('dashboard')) {
      return '/dashboard';
    }

    return normalized.startsWith('#') ? normalized : `/${normalized.replace(/^\/+/, '')}`;
  }

  private toRelativeTime(value?: string): string {
    if (!value) {
      return 'just now';
    }

    const time = new Date(value);
    if (Number.isNaN(time.getTime())) {
      return 'just now';
    }

    const diffMs = Date.now() - time.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return 'just now';
    }

    if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 min ago' : `${diffMinutes} min ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return diffHours === 1 ? '1 h ago' : `${diffHours} h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return `${Math.floor(diffDays / 7)} weeks ago`;
  }
}
