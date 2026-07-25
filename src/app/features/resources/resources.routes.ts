import { Routes } from '@angular/router';

export const RESOURCES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'categories',
    pathMatch: 'full',
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./components/resource-page/resource-page').then((m) => m.ResourcePageComponent),
    data: { resourceKey: 'categories' },
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./components/resource-page/resource-page').then((m) => m.ResourcePageComponent),
    data: { resourceKey: 'customers' },
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./components/resource-page/resource-page').then((m) => m.ResourcePageComponent),
    data: { resourceKey: 'employees' },
  },
  {
    path: 'order-details',
    loadComponent: () =>
      import('./components/resource-page/resource-page').then((m) => m.ResourcePageComponent),
    data: { resourceKey: 'order-details' },
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./components/resource-page/resource-page').then((m) => m.ResourcePageComponent),
    data: { resourceKey: 'orders' },
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./components/resource-page/resource-page').then((m) => m.ResourcePageComponent),
    data: { resourceKey: 'products' },
  },
  {
    path: 'shippers',
    loadComponent: () =>
      import('./components/resource-page/resource-page').then((m) => m.ResourcePageComponent),
    data: { resourceKey: 'shippers' },
  },
  {
    path: 'suppliers',
    loadComponent: () =>
      import('./components/resource-page/resource-page').then((m) => m.ResourcePageComponent),
    data: { resourceKey: 'suppliers' },
  },
  {
    path: 'system',
    loadComponent: () =>
      import('./components/resource-page/resource-page').then((m) => m.ResourcePageComponent),
    data: { resourceKey: 'system' },
  },
];
