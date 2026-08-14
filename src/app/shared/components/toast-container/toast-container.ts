import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/notifications/notification.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-area-top)+0.75rem)] z-50 flex flex-col items-center gap-2 px-4"
    >
      @for (toast of notifications.notifications(); track toast.id) {
        <div
          class="pointer-events-auto w-full max-w-sm rounded-lg px-4 py-3 text-sm shadow-md"
          [class]="severityClass(toast.severity)"
          role="alert"
        >
          <div class="flex items-start justify-between gap-3">
            <span>{{ toast.message }}</span>
            <button
              type="button"
              class="shrink-0 text-lg leading-none opacity-80 hover:opacity-100"
              [style.min-width.px]="44"
              [style.min-height.px]="44"
              (click)="notifications.dismiss(toast.id)"
              aria-label="Cerrar notificación"
            >
              &times;
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected readonly notifications = inject(NotificationService);

  protected severityClass(severity: string): string {
    switch (severity) {
      case 'error':
        return 'bg-[var(--color-alert)] text-[var(--color-on-alert)]';
      case 'success':
        return 'bg-[var(--color-secondary-strong)] text-[var(--color-on-secondary)]';
      default:
        return 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]';
    }
  }
}
