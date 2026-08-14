import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const SIGHTING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/sighting-list-page/sighting-list-page').then((m) => m.SightingListPage),
  },
  {
    path: 'new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/sighting-create-page/sighting-create-page').then((m) => m.SightingCreatePage),
  },
  {
    path: 'mine',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-sightings-page/my-sightings-page').then((m) => m.MySightingsPage),
  },
  {
    path: ':id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/sighting-edit-page/sighting-edit-page').then((m) => m.SightingEditPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/sighting-detail-page/sighting-detail-page').then((m) => m.SightingDetailPage),
  },
];
