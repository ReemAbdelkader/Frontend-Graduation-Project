import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
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
  {
    path: 'login',
    redirectTo: '/auth',
    pathMatch: 'full',
  },
  {
    path: 'register',
    redirectTo: '/auth',
    pathMatch: 'full',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'Forgot password — Wearly',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
    title: 'Reset password — Wearly',
  },
  {
    path: 'confirm-mail',
    loadComponent: () =>
      import('./features/confirm-mail/confirm-mail.component').then((m) => m.ConfirmMailComponent),
    title: 'Confirm mail — Wearly',
  },
  {
    path: 'auth/google-callback',
    loadComponent: () =>
      import('./features/auth/google-callback.component').then((m) => m.GoogleCallbackComponent),
    title: 'Google sign-in — Wearly',
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('./features/shop/shop.component').then((m) => m.ShopComponent),
    title: 'Shop — Wearly',
  },
  {
    path: 'templates',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/templates/templates.component').then((m) => m.TemplatesComponent),
    title: 'Templates — Wearly',
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/orders.component').then((m) => m.OrdersComponent),
    title: 'My Orders — Wearly',
  },
  {
    path: 'community',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/community/community.component').then((m) => m.CommunityComponent),
    title: 'Community — Wearly',
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
    title: 'Onboarding — Wearly',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard — Wearly',
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    title: 'Profile — Wearly',
  },
  {
    path: 'studio',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/studio/studio.component').then((m) => m.StudioComponent),
    title: 'Design Studio — Wearly',
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications-page.component').then((m) => m.NotificationsPageComponent),
    title: 'Notifications — Wearly',
  },
  {
    path: 'marketplace',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Marketplace — Wearly',
  },
  {
    path: 'rewards',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Rewards — Wearly',
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Settings — Wearly',
  },
  {
    path: 'control-center',
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
        path: 'creators',
        loadComponent: () =>
          import('./features/admin/creators/creators.component').then((m) => m.CreatorsComponent),
        title: 'Creators — Control Center',
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
      {
        path: 'rewards',
        loadComponent: () =>
          import('./features/admin/rewards/rewards.component').then((m) => m.RewardsComponent),
        title: 'Rewards — Control Center',
      },
      {
        path: 'ai-reports',
        loadComponent: () =>
          import('./features/admin/ai-reports/ai-reports.component').then((m) => m.AiReportsComponent),
        title: 'AI Reports — Control Center',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings/settings.component').then((m) => m.SettingsComponent),
        title: 'Settings — Control Center',
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
