import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { onboardingGuard } from './core/onboarding/onboarding.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/onboarding/pages/onboarding-page/onboarding-page').then((m) => m.OnboardingPage),
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [onboardingGuard],
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
    path: 'sightings',
    loadChildren: () => import('./features/sightings/sighting.routes').then((m) => m.SIGHTING_ROUTES),
  },
  {
    path: 'contact-requests',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/contact-requests/contact-request.routes').then((m) => m.CONTACT_REQUEST_ROUTES),
  },
  {
    path: 'conversations',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/conversations/conversation.routes').then((m) => m.CONVERSATION_ROUTES),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/pages/profile-page/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'moderator',
    canActivate: [roleGuard(['MODERATOR', 'ADMIN'])],
    loadComponent: () =>
      import('./features/moderator/pages/moderator-page/moderator-page').then((m) => m.ModeratorPage),
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/pages/admin-page/admin-page').then((m) => m.AdminPage),
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
];
