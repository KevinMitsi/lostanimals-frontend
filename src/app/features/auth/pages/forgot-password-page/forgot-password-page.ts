import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { TurnstileWidget } from '../../../../shared/components/turnstile-widget/turnstile-widget';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-forgot-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, TurnstileWidget],
  template: `
    <div class="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Olvidé mi contraseña</h1>

      @if (sent()) {
        <div class="card-soft">
          Si el correo está registrado, te enviamos instrucciones para restablecer tu contraseña.
          <a routerLink="/login" class="btn-link mt-3 block">
            Volver a iniciar sesión
          </a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="card flex flex-col gap-4" novalidate>
          @if (formError()) {
            <p class="banner-alert">
              {{ formError() }}
            </p>
          }

          <label class="field-label">
            Correo electrónico
            <input
              type="email"
              formControlName="email"
              class="field-input"
            />
          </label>

          <app-turnstile-widget
            #turnstile
            [siteKey]="siteKey"
            action="password-recovery"
            (verified)="onTurnstileToken($event)"
            (expired)="onTurnstileExpired()"
          />

          <button
            type="submit"
            [disabled]="submitting()"
            class="btn btn-primary"
          >
            {{ submitting() ? 'Enviando…' : 'Enviar instrucciones' }}
          </button>
        </form>
      }
    </div>
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly siteKey = environment.turnstileSiteKey;

  private readonly turnstileWidget = viewChild<TurnstileWidget>('turnstile');

  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    turnstileToken: ['', [Validators.required]],
  });

  protected onTurnstileToken(token: string): void {
    this.form.controls.turnstileToken.setValue(token);
  }

  protected onTurnstileExpired(): void {
    this.form.controls.turnstileToken.setValue('');
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        if (error.status === 422) {
          this.form.controls.turnstileToken.setValue('');
          this.turnstileWidget()?.reset();
        }
        this.formError.set(error.detail);
      },
    });
  }
}
