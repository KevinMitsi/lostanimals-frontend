import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { USER_ROLE_LABELS } from '../../../../core/labels/labels';
import { AuthService } from '../../../auth/auth.service';
import { ContactRequestService } from '../../../contact-requests/contact-request.service';
import { PushNotificationService } from '../../../push-subscriptions/push-notification.service';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto flex max-w-lg flex-col gap-5 px-4 py-6">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Perfil</h1>

      <div class="card flex flex-col gap-2">
        <span class="font-semibold text-[var(--color-text)]">{{ session.email() }}</span>
        <span class="badge w-fit bg-[var(--color-surface)]">{{ roleLabels[session.role()!] }}</span>
      </div>

      <div class="card flex flex-col gap-3">
        <h2 class="text-lg font-bold tracking-tight text-[var(--color-primary-strong)]">Mi actividad</h2>
        <div class="flex flex-wrap gap-2">
          <a routerLink="/lost-pet-reports/mine" class="btn btn-ghost">Mis reportes</a>
          <a routerLink="/sightings/mine" class="btn btn-ghost">Mis avistamientos</a>
          <a routerLink="/contact-requests" class="btn btn-ghost relative">
            Solicitudes de contacto
            @if (pendingRequestCount() > 0) {
              <span
                class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-alert)] px-1 text-[10px] font-bold text-[var(--color-on-alert)]"
              >
                {{ pendingRequestCount() }}
              </span>
            }
          </a>
          <a routerLink="/onboarding" class="btn btn-ghost">Ver tutorial de nuevo</a>
        </div>
      </div>

      <div class="card flex flex-col gap-2">
        <h2 class="text-lg font-bold tracking-tight text-[var(--color-primary-strong)]">Notificaciones push</h2>
        @if (!push.configured) {
          <label class="flex items-center gap-3 text-sm opacity-60">
            <input type="checkbox" disabled class="h-5 w-5" />
            Activar notificaciones
          </label>
          <p class="text-xs text-[var(--color-text)] opacity-70">
            Las notificaciones push no están configuradas en este entorno.
          </p>
        } @else if (push.state() === 'unsupported') {
          <label class="flex items-center gap-3 text-sm opacity-60">
            <input type="checkbox" disabled class="h-5 w-5" />
            Activar notificaciones
          </label>
          <p class="text-xs text-[var(--color-text)] opacity-70">
            Tu navegador no admite notificaciones push.
          </p>
        } @else if (push.state() === 'denied') {
          <label class="flex items-center gap-3 text-sm opacity-60">
            <input type="checkbox" disabled class="h-5 w-5" />
            Activar notificaciones
          </label>
          <p class="text-xs text-[var(--color-text)] opacity-70">
            Bloqueaste las notificaciones para este sitio. Actívalas desde la configuración de tu
            navegador si quieres recibirlas.
          </p>
        } @else {
          <label class="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              [checked]="push.subscribed()"
              [disabled]="push.busy()"
              (change)="onTogglePush($any($event.target).checked)"
              class="h-5 w-5"
            />
            Activar notificaciones
          </label>
          <p class="text-xs text-[var(--color-text)] opacity-70">
            Recibe un aviso cuando alguien te escriba o haya novedades sobre tus reportes y
            avistamientos.
          </p>
        }
      </div>

      <button type="button" (click)="logout()" class="btn btn-alert self-start">Cerrar sesión</button>
    </div>
  `,
})
export class ProfilePage {
  protected readonly session = inject(SessionStore);
  protected readonly roleLabels = USER_ROLE_LABELS;
  protected readonly push = inject(PushNotificationService);

  private readonly authService = inject(AuthService);
  private readonly contactRequestService = inject(ContactRequestService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);
  protected readonly pendingRequestCount = signal(0);

  constructor() {
    this.contactRequestService.getReceived().subscribe({
      next: (requests) => {
        this.pendingRequestCount.set(requests.filter((r) => r.status === 'PENDING').length);
      },
    });
  }

  protected onTogglePush(checked: boolean): void {
    if (checked) {
      void this.push.enable();
    } else {
      this.push.disable();
    }
  }

  protected logout(): void {
    this.loggingOut.set(true);
    this.authService.logout().subscribe(() => {
      this.loggingOut.set(false);
      this.router.navigateByUrl('/');
    });
  }
}
