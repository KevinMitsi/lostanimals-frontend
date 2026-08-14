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
    <div class="card mx-4 mt-10 flex max-w-md flex-col items-center gap-4 text-center sm:mx-auto">
      @switch (state()) {
        @case ('verifying') {
          <p>Verificando tu correo…</p>
        }
        @case ('success') {
          <h1 class="text-2xl font-bold tracking-tight text-[var(--color-primary-strong)]">¡Correo verificado!</h1>
          <a routerLink="/login" class="btn-link">Iniciar sesión</a>
        }
        @case ('missing-token') {
          <p class="text-[var(--color-alert-strong)]">
            No se encontró un token de verificación en el enlace.
          </p>
        }
        @case ('error') {
          <p class="text-[var(--color-alert-strong)]">{{ errorMessage() }}</p>
          <a routerLink="/resend-verification" class="btn-link">
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
