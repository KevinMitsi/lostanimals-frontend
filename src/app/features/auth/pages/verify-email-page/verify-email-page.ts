import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { AuthService } from '../../auth.service';

type VerifyState = 'verifying' | 'success' | 'error' | 'missing-token';

@Component({
  selector: 'app-verify-email-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto flex min-h-full max-w-md flex-col items-center gap-4 px-4 py-12 text-center">
      @switch (state()) {
        @case ('verifying') {
          <p>Verificando tu correo…</p>
        }
        @case ('success') {
          <h1 class="text-xl font-semibold text-[var(--color-primary-strong)]">¡Correo verificado!</h1>
          <a routerLink="/login" class="font-semibold text-[var(--color-primary-strong)]">Iniciar sesión</a>
        }
        @case ('missing-token') {
          <p class="text-[var(--color-alert-strong)]">
            No se encontró un token de verificación en el enlace.
          </p>
        }
        @case ('error') {
          <p class="text-[var(--color-alert-strong)]">{{ errorMessage() }}</p>
          <a routerLink="/resend-verification" class="font-semibold text-[var(--color-primary-strong)]">
            Reenviar correo de verificación
          </a>
        }
      }
    </div>
  `,
})
export class VerifyEmailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly state = signal<VerifyState>('verifying');
  protected readonly errorMessage = signal('');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('missing-token');
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => this.state.set('success'),
      error: (error: AppApiError) => {
        this.errorMessage.set(error.detail);
        this.state.set('error');
      },
    });
  }
}
