import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const LOST_PET_REPORT_ROUTES: Routes = [
  {
    path: 'new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/report-create-page/report-create-page').then((m) => m.ReportCreatePage),
  },
  {
    path: 'mine',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-reports-page/my-reports-page').then((m) => m.MyReportsPage),
  },
  {
    path: ':id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/report-edit-page/report-edit-page').then((m) => m.ReportEditPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/report-detail-page/report-detail-page').then((m) => m.ReportDetailPage),
  },
];
