import { Routes } from '@angular/router';
import { staffAccessGuard } from './core/staff-access.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/customer/customer-page').then((module) => module.CustomerPage),
  },
  {
    path: 'carrito',
    loadComponent: () => import('./features/cart/cart-page').then((module) => module.CartPage),
  },
  {
    path: 'pedidos',
    loadComponent: () =>
      import('./features/customer/orders-page').then((module) => module.OrdersPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'cocina',
    canMatch: [staffAccessGuard],
    loadComponent: () =>
      import('./features/kitchen/kitchen-page').then((module) => module.KitchenPage),
  },
  {
    path: 'admin',
    canMatch: [staffAccessGuard],
    loadComponent: () => import('./features/admin/admin-page').then((module) => module.AdminPage),
  },
  {
    path: 'b/:code',
    canMatch: [staffAccessGuard],
    children: [{ path: '', pathMatch: 'full', redirectTo: '/admin' }],
  },
  {
    path: '**',
    canMatch: [staffAccessGuard],
    children: [{ path: '', pathMatch: 'full', redirectTo: '/admin' }],
  },
];
