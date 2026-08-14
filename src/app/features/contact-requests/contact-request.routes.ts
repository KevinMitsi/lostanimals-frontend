import { Routes } from '@angular/router';

export const CONTACT_REQUEST_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/contact-requests-page/contact-requests-page').then((m) => m.ContactRequestsPage),
  },
];
