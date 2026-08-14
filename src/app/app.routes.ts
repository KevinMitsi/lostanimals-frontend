import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/lost-pet-reports/pages/report-list-page/report-list-page').then(
        (m) => m.ReportListPage,
      ),
  },
  {
    path: 'lost-pet-reports',
    loadChildren: () =>
      import('./features/lost-pet-reports/lost-pet-report.routes').then((m) => m.LOST_PET_REPORT_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
];
