import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home').then(m => m.HomePageComponent)
  }
];
