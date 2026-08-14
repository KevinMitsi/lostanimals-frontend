import { Injectable, signal } from '@angular/core';

export type NotificationSeverity = 'info' | 'success' | 'error';

export interface AppNotification {
  id: number;
  severity: NotificationSeverity;
  message: string;
}

const AUTO_DISMISS_MS = 6000;

/** Cola de notificaciones global (toasts), mostrada por ToastContainer en el shell. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  readonly notifications = signal<AppNotification[]>([]);

  error(message: string): void {
    this.push('error', message);
  }

  success(message: string): void {
    this.push('success', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  private push(severity: NotificationSeverity, message: string): void {
    const id = this.nextId++;
    this.notifications.update((list) => [...list, { id, severity, message }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
