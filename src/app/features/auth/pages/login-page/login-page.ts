import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { TurnstileWidget } from '../../../../shared/components/turnstile-widget/turnstile-widget';
import { GoogleAuthButton } from '../../../../shared/components/google-auth-button/google-auth-button';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, TurnstileWidget, GoogleAuthButton],
  template: `
    <div class="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Iniciar sesión</h1>

      @if (emailNotVerified()) {
        <div class="card-soft">
          Tu cuenta existe pero el correo aún no está verificado.
          <a routerLink="/resend-verification" [queryParams]="{ email: form.value.email }"
             class="btn-link mt-2 block">
            Reenviar correo de verificación
          </a>
        </div>
      }

      @if (formError()) {
        <p class="banner-alert">
          {{ formError() }}
        </p>
      }

      <div class="card flex flex-col gap-3">
        <p class="text-center text-xs text-[var(--color-text)] opacity-70">
          ¿Ya tienes una cuenta con Google? Inicia sesión con ella.
        </p>
        <app-google-auth-button
          text="signin_with"
          [disabled]="submitting()"
          (credentialReceived)="onGoogleCredential($event)"
        />
      </div>

      <div class="flex items-center gap-3 text-xs uppercase tracking-wide opacity-60">
        <span class="h-px flex-1 bg-[var(--color-surface)]"></span><span>o con correo</span>
        <span class="h-px flex-1 bg-[var(--color-surface)]"></span>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="card flex flex-col gap-4" novalidate>
        <label class="field-label">
          Correo electrónico
          <input
            type="email"
            formControlName="email"
            class="field-input"
          />
        </label>

        <label class="field-label">
          Contraseña
          <input
            type="password"
            formControlName="password"
            class="field-input"
          />
        </label>

        <app-turnstile-widget
          #turnstile
          [siteKey]="siteKey"
          action="login"
          (verified)="onTurnstileToken($event)"
          (expired)="onTurnstileExpired()"
        />

        <button
          type="submit"
          [disabled]="submitting()"
          class="btn btn-primary"
        >
          {{ submitting() ? 'Ingresando…' : 'Ingresar' }}
        </button>

        <a routerLink="/forgot-password" class="btn-link block text-center">
          Olvidé mi contraseña
        </a>
        <a routerLink="/register" class="btn-link block text-center">
          Crear una cuenta
        </a>
      </form>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly siteKey = environment.turnstileSiteKey;

  private readonly turnstileWidget = viewChild<TurnstileWidget>('turnstile');

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly emailNotVerified = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
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
    this.emailNotVerified.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        this.handleError(error);
      },
    });
  }

  protected onGoogleCredential(credential: string): void {
    this.formError.set(null);
    this.emailNotVerified.set(false);
    this.submitting.set(true);

    this.authService.authenticateWithGoogle({ credential, acceptsDataProcessing: false }).subscribe({
      next: (result) => {
        this.submitting.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        this.router.navigateByUrl(result.profileComplete ? returnUrl : '/complete-profile');
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        if (error.status === 422) {
          this.formError.set('No encontramos una cuenta con este correo de Google. Crea una cuenta primero.');
          return;
        }
        this.formError.set(error.detail);
      },
    });
  }

  private handleError(error: AppApiError): void {
    if (error.status === 401) {
      this.formError.set('Credenciales inválidas.');
      return;
    }

    if (error.status === 403) {
      this.emailNotVerified.set(true);
      return;
    }

    if (error.status === 422) {
      this.formError.set(error.detail);
      this.form.controls.turnstileToken.setValue('');
      this.turnstileWidget()?.reset();
      return;
    }

    this.formError.set(error.detail);
  }
}
