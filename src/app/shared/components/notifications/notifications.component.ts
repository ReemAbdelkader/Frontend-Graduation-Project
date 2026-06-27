import { Component, effect, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly closing = signal(false);
  notifications: NotificationItem[] = [];
  loading = false;
  errorMessage = '';
  private notificationSubscription: Subscription | null = null;

  constructor() {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.loadNotifications();
      }
    });
  }

  ngOnInit(): void {
    this.notificationSubscription = this.notificationService.newNotification$.subscribe((notification) => {
      this.notifications = [
        { ...notification },
        ...this.notifications.filter((item) => item.id !== notification.id),
      ];
    });

    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
  }

  toggle(): void {
    if (this.closing()) {
      return;
    }

    if (!this.open()) {
      this.loadNotifications();
      this.open.set(true);
      return;
    }

    this.close();
  }

  close(): void {
    if (!this.open()) {
      return;
    }

    this.closing.set(true);
    window.setTimeout(() => {
      this.open.set(false);
      this.closing.set(false);
    }, 180);
  }

  loadNotifications(): void {
    if (!this.authService.isLoggedIn()) {
      this.notifications = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.notificationService.getAll().subscribe({
      next: (items) => {
        this.notifications = items;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load notifications.';
        this.loading = false;
      },
    });
  }

  markAsRead(notification: NotificationItem): void {
    const shouldNavigate = !!notification.destination && !this.router.url.startsWith('/notifications');

    const completeAction = () => {
      if (shouldNavigate && notification.destination) {
        this.close();
        this.router.navigate([notification.destination]);
      }
    };

    if (!notification.unread) {
      completeAction();
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe((success) => {
      if (!success) {
        this.toastService.error('Unable to mark this notification as read.');
        return;
      }

      this.notifications = this.notifications.map((item) => (item.id === notification.id ? { ...item, unread: false } : item));
      this.notificationService.refreshUnreadCount();
      completeAction();
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) {
      return;
    }

    this.notificationService.markAllAsRead().subscribe((success) => {
      if (!success) {
        this.toastService.error('Unable to mark all notifications as read.');
        return;
      }

      this.notifications = this.notifications.map((item) => ({ ...item, unread: false }));
      this.notificationService.refreshUnreadCount();
    });
  }

  goToNotificationsPage(): void {
    this.close();
    this.router.navigate(['/notifications']);
  }

  get unreadCount(): number {
    return this.notificationService.unreadCount();
  }
}
