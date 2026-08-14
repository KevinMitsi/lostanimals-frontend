import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { USER_ROLE_LABELS } from '../../../../core/labels/labels';
import { AuthService } from '../../../auth/auth.service';

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
          <a routerLink="/contact-requests" class="btn btn-ghost">Solicitudes de contacto</a>
          <a routerLink="/onboarding" class="btn btn-ghost">Ver tutorial de nuevo</a>
        </div>
      </div>

      <div class="card flex flex-col gap-2">
        <h2 class="text-lg font-bold tracking-tight text-[var(--color-primary-strong)]">Notificaciones push</h2>
        <label class="flex items-center gap-3 text-sm opacity-60">
          <input type="checkbox" disabled class="h-5 w-5" />
          Activar notificaciones
        </label>
        <p class="text-xs text-[var(--color-text)] opacity-70">
          Próximamente. El servicio ya está conectado al backend
          (<code>/push-subscriptions</code>), pero falta integrar un proveedor de push
          (Firebase Cloud Messaging u otro) en este proyecto para poder generar un token de
          dispositivo real.
        </p>
      </div>

      <button type="button" (click)="logout()" class="btn btn-alert self-start">Cerrar sesión</button>
    </div>
  `,
})
export class ProfilePage {
  protected readonly session = inject(SessionStore);
  protected readonly roleLabels = USER_ROLE_LABELS;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);

  protected logout(): void {
    this.loggingOut.set(true);
    this.authService.logout().subscribe(() => {
      this.loggingOut.set(false);
      this.router.navigateByUrl('/');
    });
  }
}
