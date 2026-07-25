import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/home/home.routes').then(m => m.HOME_ROUTES)
  },
  {
    path: 'explorer',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/api-explorer/api-explorer.routes').then((m) => m.API_EXPLORER_ROUTES)
  },
  {
    path: 'resources',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/resources/resources.routes').then((m) => m.RESOURCES_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
