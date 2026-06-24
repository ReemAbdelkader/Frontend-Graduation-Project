import { Component, signal } from '@angular/core';

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationBellComponent {
  readonly open = signal(false);

  readonly notifications: NotificationItem[] = [
    {
      id: 1,
      title: 'Order shipped',
      body: 'WLY-2026-00482 is on its way to you.',
      time: '2h ago',
      unread: true,
    },
    {
      id: 2,
      title: 'New community like',
      body: 'Aiko Tanaka liked your "Onyx Studio Tee" design.',
      time: '5h ago',
      unread: true,
    },
    {
      id: 3,
      title: 'AI design ready',
      body: 'Your "Coral Mark Cap variant" is ready to review.',
      time: '1d ago',
      unread: false,
    },
  ];

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => n.unread).length;
  }
}
