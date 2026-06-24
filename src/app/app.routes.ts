import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ============ PUBLIC ============
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
    title: 'Wearly — Design. Generate. Wear.',
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
    title: 'Sign in — Wearly',
  },

  // ============ USER-SIDE ============
  {
    path: 'shop',
    loadComponent: () =>
      import('./features/shop/shop.component').then((m) => m.ShopComponent),
    title: 'Shop — Wearly',
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./features/templates/templates.component').then((m) => m.TemplatesComponent),
    title: 'Template Hub — Wearly',
  },
  {
    path: 'community',
    loadComponent: () =>
      import('./features/community/community.component').then((m) => m.CommunityComponent),
    title: 'Community — Wearly',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard — Wearly',
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/orders.component').then((m) => m.OrdersComponent),
    title: 'My Orders — Wearly',
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
    title: 'Style onboarding — Wearly',
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    title: 'Profile — Wearly',
  },

  // ============ STUDIO — DO NOT TOUCH (teammate's custom work) ============
  {
    path: 'studio',
    loadComponent: () =>
      import('./features/studio/studio.component').then((m) => m.StudioComponent),
    title: 'Design Studio — Wearly',
  },

  // ============ ADMIN CONTROL CENTER (admin role required) ============
  {
    path: 'control-center',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/overview/overview.component').then((m) => m.OverviewComponent),
        title: 'Overview — Control Center',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users.component').then((m) => m.UsersComponent),
        title: 'Users — Control Center',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/orders.component').then((m) => m.OrdersComponent),
        title: 'Orders — Control Center',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/categories.component').then((m) => m.CategoriesComponent),
        title: 'Categories — Control Center',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/products.component').then((m) => m.ProductsComponent),
        title: 'Products — Control Center',
      },
      {
        path: 'templates',
        loadComponent: () =>
          import('./features/admin/templates/templates.component').then((m) => m.TemplatesComponent),
        title: 'Templates — Control Center',
      },
      {
        path: 'moderation',
        loadComponent: () =>
          import('./features/admin/moderation/moderation.component').then((m) => m.ModerationComponent),
        title: 'Moderation — Control Center',
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
