import { Routes } from '@angular/router';

export const CONVERSATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/conversation-list-page/conversation-list-page').then((m) => m.ConversationListPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/conversation-thread-page/conversation-thread-page').then(
        (m) => m.ConversationThreadPage,
      ),
  },
];
