import { Routes } from '@angular/router';

export const API_EXPLORER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/api-explorer/api-explorer').then((m) => m.ApiExplorerComponent),
  },
];
