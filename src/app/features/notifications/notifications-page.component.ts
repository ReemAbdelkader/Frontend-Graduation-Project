import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotificationService, NotificationItem } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-shell">
      <div class="page-card">
        <div class="page-header">
          <div>
            <p class="eyebrow">Updates</p>
            <h1>Notifications</h1>
          </div>
          <button class="secondary-btn" type="button" (click)="markAllAsRead()" [disabled]="loading || unreadCount === 0">
            Mark all as read
          </button>
        </div>

        @if (loading) {
          <div class="state-card">
            <p>Loading notifications…</p>
          </div>
        } @else if (errorMessage) {
          <div class="state-card error">
            <p>{{ errorMessage }}</p>
            <button class="secondary-btn" type="button" (click)="loadNotifications()">Try again</button>
          </div>
        } @else if (!notifications.length) {
          <div class="state-card empty">
            <p>You’re all caught up.</p>
            <span>No notifications right now.</span>
          </div>
        } @else {
          <ul class="notification-list">
            @for (notification of notifications; track notification.id) {
              <li class="notification-item" [class.unread]="notification.unread" (click)="openNotification(notification)">
                <div class="dot"></div>
                <div class="content">
                  <div class="row">
                    <h3>{{ notification.title }}</h3>
                    <span class="time">{{ notification.time }}</span>
                  </div>
                  <p>{{ notification.message }}</p>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.page-shell { min-height: calc(100vh - 80px); padding: 2rem 1rem 3rem; background: var(--background); }`,
    `.page-card { max-width: 860px; margin: 0 auto; background: var(--card); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shadow-elegant); padding: 1.5rem; }`,
    `.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }`,
    `.eyebrow { margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.24em; font-size: 0.72rem; color: var(--muted-foreground); }`,
    `h1 { font-size: 1.6rem; }`,
    `.secondary-btn { border: 1px solid var(--border); background: var(--secondary); color: var(--foreground); padding: 0.7rem 1rem; border-radius: 999px; font-weight: 600; }`,
    `.secondary-btn:disabled { opacity: 0.5; cursor: not-allowed; }`,
    `.state-card { padding: 1.5rem; border: 1px dashed var(--border); border-radius: 16px; text-align: center; color: var(--muted-foreground); display: grid; gap: 0.75rem; justify-items: center; }`,
    `.state-card.error { color: var(--destructive); }`,
    `.notification-list { display: grid; gap: 0.75rem; }`,
    `.notification-item { display: flex; gap: 0.85rem; align-items: flex-start; padding: 1rem; border: 1px solid var(--border); border-radius: 16px; background: var(--card); cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }`,
    `.notification-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-soft); }`,
    `.notification-item.unread { background: color-mix(in srgb, var(--accent) 10%, var(--card)); }`,
    `.notification-item.unread .dot { background: var(--accent); }`,
    `.dot { width: 10px; height: 10px; border-radius: 999px; background: var(--border); margin-top: 0.45rem; flex-shrink: 0; }`,
    `.content { flex: 1; min-width: 0; }`,
    `.row { display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; margin-bottom: 0.25rem; }`,
    `h3 { font-size: 1rem; }`,
    `.time { font-size: 0.78rem; color: var(--muted-foreground); white-space: nowrap; }`,
    `.content p { margin: 0; color: var(--muted-foreground); }`,
    '@media (max-width: 640px) { .page-shell { padding: 1rem 0.75rem 2rem; } .page-card { padding: 1rem; } .page-header { flex-direction: column; align-items: stretch; } .secondary-btn { width: 100%; } .row { flex-direction: column; align-items: flex-start; } }',
  ],
})
export class NotificationsPageComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  notifications: NotificationItem[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.errorMessage = '';
    this.notificationService.getAll().subscribe({
      next: (items) => {
        this.notifications = items;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'We could not load your notifications right now.';
        this.loading = false;
      },
    });
  }

  openNotification(notification: NotificationItem): void {
    if (!notification.unread) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe((success) => {
      if (!success) {
        this.toastService.error('Unable to mark notification as read.');
        return;
      }

      this.notifications = this.notifications.map((item) => (item.id === notification.id ? { ...item, unread: false, time: item.time } : item));
      this.toastService.success('Notification marked as read.');
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) {
      return;
    }

    this.notificationService.markAllAsRead().subscribe((success) => {
      if (!success) {
        this.toastService.error('Unable to update notifications.');
        return;
      }

      this.notifications = this.notifications.map((item) => ({ ...item, unread: false }));
      this.toastService.success('All notifications marked as read.');
    });
  }

  get unreadCount(): number {
    return this.notifications.filter((item) => item.unread).length;
  }
}
