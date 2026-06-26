import { Component, OnInit, signal } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  templateUrl: './notifications.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit {
  readonly open = signal(false);
  readonly notifications = this.notifService.notifications;

  constructor(private readonly notifService: NotificationService) {}

  ngOnInit(): void {
    this.notifService.loadNotifications();
  }

  toggle(): void {
    this.open.update((v) => !v);
    if (this.open()) {
      this.notifService.markAllAsRead();
    }
  }

  close(): void {
    this.open.set(false);
  }

  get unreadCount(): number {
    return this.notifications().filter((n) => n.unread).length;
  }
}