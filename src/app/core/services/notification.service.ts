import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificationItem } from '../models/shop.models';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/notifications`;

  readonly notifications = signal<NotificationItem[]>([]);

  loadNotifications(): void {
    this.http.get<NotificationItem[]>(this.baseUrl).subscribe({
      next: (data) => this.notifications.set(data),
      error: (err) => console.error('Failed to load notifications', err)
    });
  }

  pushNewNotification(notification: NotificationItem): void {
    this.notifications.update((current) => [notification, ...current]);
  }

  markAllAsRead(): void {
    this.notifications.update(current => 
      current.map(n => ({ ...n, unread: false }))
    );
  }
}