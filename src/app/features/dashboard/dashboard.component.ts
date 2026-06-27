import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product } from '../../core/data/wearly-data';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardApiService,
  DesignResponseDto,
  NotificationDto,
  OrderListDto,
} from '../../core/services/dashboard-api.service';
import { ProductDto, ShopApiService } from '../../core/services/shop-api.service';
import { TemplateDto } from '../../core/services/templates-api.service';

interface Stat {
  label: string;
  value: string;
  delta?: string;
  icon: 'bookmark' | 'package' | 'heart';
  tint: string;
}

interface QuickAccess {
  to: string;
  title: string;
  desc: string;
  icon: 'wand' | 'template' | 'users' | 'package';
}

interface DraftDesign {
  title: string;
  product: string;
  image: string;
  status: string;
  startedFromTemplate: boolean;
}

interface ActivityItem {
  time: string;
  action: string;
  target: string;
}

interface ActiveOrder {
  id: string;
  status: string;
  eta: string;
}

const TERMINAL_ORDER_STATUSES = new Set(['delivered', 'cancelled', 'returned']);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, AppNavComponent, ProductCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardApi = inject(DashboardApiService);
  private shopApi = inject(ShopApiService);

  readonly user = this.auth.user;
  readonly isAdmin = this.auth.isAdmin;
  readonly loading = signal(true);

  private readonly designs = signal<DesignResponseDto[]>([]);
  private readonly orders = signal<OrderListDto[]>([]);
  private readonly notifications = signal<NotificationDto[]>([]);
  private readonly products = signal<ProductDto[]>([]);
  private readonly templates = signal<TemplateDto[]>([]);

  readonly featuredDraft = computed<DraftDesign | null>(() => {
    const design = this.pickFeaturedDesign(this.designs());
    if (!design) return null;

    const productName = design.productName?.trim() || 'Custom product';

    return {
      title: `${productName} design`,
      product: productName,
      image: this.dashboardApi.resolveAssetUrl(design.snapshotImageURL),
      status: design.status || 'Saved',
      startedFromTemplate: Boolean(design.templateId),
    };
  });

  readonly activeOrder = computed<ActiveOrder | null>(() => {
    const active = this.activeOrders()
      .sort((a, b) => this.toTime(b.estimatedDeliveryDate || b.placedDate) - this.toTime(a.estimatedDeliveryDate || a.placedDate))[0];

    if (!active) return null;

    return {
      id: active.orderNumber || active.orderId,
      status: (active.orderStatus || 'Pending').toUpperCase(),
      eta: this.formatDate(active.estimatedDeliveryDate || active.placedDate),
    };
  });

  readonly stats = computed<Stat[]>(() => {
    const savedDesigns = this.designs().length;
    const activeOrders = this.activeOrders();
    const shippedOrders = activeOrders.filter((order) => this.normalizeStatus(order.orderStatus) === 'shipped').length;
    const communityLikes = this.templates().reduce((sum, template) => sum + (Number(template.likesCount) || 0), 0);
    const templateCount = this.templates().length;

    return [
      {
        label: 'Saved designs',
        value: this.formatNumber(savedDesigns),
        icon: 'bookmark',
        tint: 'from-primary',
      },
      {
        label: 'Active orders',
        value: this.formatNumber(activeOrders.length),
        delta: shippedOrders > 0 ? `${shippedOrders} shipped` : undefined,
        icon: 'package',
        tint: 'from-accent',
      },
      {
        label: 'Community likes',
        value: this.formatNumber(communityLikes),
        delta: templateCount > 0 ? `Across ${templateCount} template${templateCount === 1 ? '' : 's'}` : undefined,
        icon: 'heart',
        tint: 'from-success',
      },
    ];
  });

  readonly recos = computed<Product[]>(() => this.products().map((product) => this.mapProduct(product)));

  readonly activity = computed<ActivityItem[]>(() => {
    return [...this.notifications()]
      .sort((a, b) => this.toTime(b.createdAt) - this.toTime(a.createdAt))
      .slice(0, 4)
      .map((notification) => ({
        time: this.relativeTime(notification.createdAt),
        action: notification.title || this.notificationTypeLabel(notification.type),
        target: notification.message || this.notificationTypeLabel(notification.type),
      }));
  });

  readonly quickAccess: QuickAccess[] = [
    { to: '/studio', title: 'Start a design', desc: 'Create with AI tools', icon: 'wand' },
    { to: '/templates', title: 'Use a template', desc: 'Begin from a curated style', icon: 'template' },
    { to: '/community', title: 'Explore community work', desc: 'Find ideas from creators', icon: 'users' },
    { to: '/orders', title: 'Check production', desc: 'Track orders and history', icon: 'package' },
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  get firstName(): string {
    return (this.user()?.name ?? 'there').split(' ')[0];
  }

  get greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 18) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }

  get currentDate(): string {
    return new Intl.DateTimeFormat('en', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }

  private loadDashboard(): void {
    const userId = this.currentUserId();

    forkJoin({
      designs: this.dashboardApi.getDesigns().pipe(catchError(() => of([]))),
      orders: userId ? this.dashboardApi.getOrders(userId).pipe(catchError(() => of([]))) : of([]),
      notifications: this.dashboardApi.getNotifications().pipe(catchError(() => of([]))),
      products: this.shopApi.getProducts(1, 4).pipe(
        map((result) => result.data ?? []),
        catchError(() => of([])),
      ),
      templates: this.dashboardApi.getAllMyTemplates().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ designs, orders, notifications, products, templates }) => {
        this.designs.set(designs);
        this.orders.set(orders);
        this.notifications.set(notifications);
        this.products.set(products);
        this.templates.set(templates);
      });
  }

  private activeOrders(): OrderListDto[] {
    return this.orders().filter((order) => !TERMINAL_ORDER_STATUSES.has(this.normalizeStatus(order.orderStatus)));
  }

  private pickFeaturedDesign(designs: DesignResponseDto[]): DesignResponseDto | null {
    return designs.find((design) => this.normalizeStatus(design.status) === 'draft') ?? designs[0] ?? null;
  }

  private mapProduct(product: ProductDto): Product {
    return {
      id: product.id,
      name: product.name,
      category: product.categoryName || 'Product',
      price: Number(product.basePrice) || 0,
      rating: Number(product.averageRating) || 0,
      reviews: product.reviewCount,
      image: this.dashboardApi.resolveAssetUrl(product.previewImageUrl),
      colors: [],
      isAvailable: product.isAvailable,
    };
  }

  private currentUserId(): string | null {
    const token = this.auth.accessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(this.decodeBase64Url(token.split('.')[1] ?? '')) as Record<string, unknown>;
      const claimNames = [
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
        'nameid',
        'sub',
        'userId',
        'uid',
      ];

      for (const claim of claimNames) {
        const value = payload[claim];
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return atob(padded);
  }

  private notificationTypeLabel(type: number | string): string {
    const value = String(type).toLowerCase();
    const labels: Record<string, string> = {
      '1': 'Order update',
      orderupdate: 'Order update',
      '2': 'New message',
      newmessage: 'New message',
      '3': 'System alert',
      systemalert: 'System alert',
      '4': 'Template liked',
      templateliked: 'Template liked',
      '5': 'Template commented',
      templatecommented: 'Template commented',
      '6': 'Moderation update',
      moderationupdate: 'Moderation update',
      '7': 'Reward earned',
      rewardearned: 'Reward earned',
    };

    return labels[value] ?? 'Notification';
  }

  private normalizeStatus(status: string | null | undefined): string {
    return (status ?? '').trim().toLowerCase();
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en').format(value);
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  private relativeTime(value: string): string {
    const time = this.toTime(value);
    if (!time) return 'now';

    const diffMinutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;

    return `${Math.floor(diffDays / 7)}w`;
  }

  private toTime(value: string | null | undefined): number {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
}
