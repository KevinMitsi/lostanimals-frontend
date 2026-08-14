import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AppApiError, splitFieldError } from '../../../../core/http/problem-detail.util';
import {
  colombianPhoneValidator,
  documentNumberValidator,
  passwordComplexityValidator,
} from '../../../../core/validators/validators';
import { TurnstileWidget } from '../../../../shared/components/turnstile-widget/turnstile-widget';
import { AuthService } from '../../auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, TurnstileWidget],
  template: `
    <div class="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 class="text-2xl font-semibold text-[var(--color-primary-strong)]">Crear cuenta</h1>

      @if (registered()) {
        <div class="rounded-lg bg-[var(--color-surface)] p-4 text-sm">
          Cuenta creada. Revisa tu correo <strong>{{ form.value.email }}</strong> para verificarla antes de
          iniciar sesión.
          <a routerLink="/login" class="mt-3 block font-semibold text-[var(--color-primary-strong)]">
            Ir a iniciar sesión
          </a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4" novalidate>
          @if (formError()) {
            <p class="rounded-md bg-[var(--color-alert)] px-3 py-2 text-sm text-[var(--color-on-alert)]">
              {{ formError() }}
            </p>
          }

          <label class="flex flex-col gap-1 text-sm">
            Nombre a mostrar
            <input
              type="text"
              formControlName="displayName"
              class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3"
            />
            @if (isInvalid('displayName')) {
              <span class="text-xs text-[var(--color-alert-strong)]">
                Debe tener entre 2 y 100 caracteres.
              </span>
            }
          </label>

          <label class="flex flex-col gap-1 text-sm">
            Correo electrónico
            <input
              type="email"
              formControlName="email"
              class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3"
            />
            @if (isInvalid('email')) {
              <span class="text-xs text-[var(--color-alert-strong)]">Ingresa un correo válido.</span>
            }
          </label>

          <label class="flex flex-col gap-1 text-sm">
            Teléfono (+573XXXXXXXXX)
            <input
              type="tel"
              formControlName="phone"
              placeholder="+573001234567"
              class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3"
            />
            @if (isInvalid('phone')) {
              <span class="text-xs text-[var(--color-alert-strong)]">
                Formato colombiano requerido: +573XXXXXXXXX.
              </span>
            }
          </label>

          <label class="flex flex-col gap-1 text-sm">
            Número de cédula
            <input
              type="text"
              formControlName="documentNumber"
              class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3"
            />
            @if (isInvalid('documentNumber')) {
              <span class="text-xs text-[var(--color-alert-strong)]">Debe tener entre 6 y 10 dígitos.</span>
            }
          </label>

          <label class="flex flex-col gap-1 text-sm">
            Contraseña
            <input
              type="password"
              formControlName="password"
              class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3"
            />
            @if (isInvalid('password')) {
              <span class="text-xs text-[var(--color-alert-strong)]">
                12-72 caracteres, con mayúscula, minúscula y número.
              </span>
            }
          </label>

          <label class="flex flex-col gap-1 text-sm">
            Confirmar contraseña
            <input
              type="password"
              formControlName="confirmPassword"
              class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3"
            />
            @if (form.errors?.['passwordsMismatch'] && form.get('confirmPassword')?.touched) {
              <span class="text-xs text-[var(--color-alert-strong)]">Las contraseñas no coinciden.</span>
            }
          </label>

          <label class="flex min-h-[44px] items-center gap-2 text-sm">
            <input type="checkbox" formControlName="acceptsDataProcessing" class="h-5 w-5" />
            Acepto el tratamiento de mis datos personales.
          </label>
          @if (isInvalid('acceptsDataProcessing')) {
            <span class="-mt-2 text-xs text-[var(--color-alert-strong)]">
              Debes aceptar el tratamiento de datos para continuar.
            </span>
          }

          <app-turnstile-widget
            #turnstile
            [siteKey]="siteKey"
            action="register"
            (verified)="onTurnstileToken($event)"
            (expired)="onTurnstileExpired()"
          />

          <button
            type="submit"
            [disabled]="submitting()"
            class="min-h-[44px] rounded-md bg-[var(--color-primary-strong)] px-4 text-[var(--color-on-primary)] disabled:opacity-60"
          >
            {{ submitting() ? 'Creando cuenta…' : 'Crear cuenta' }}
          </button>

          <a routerLink="/login" class="text-center text-sm text-[var(--color-primary-strong)]">
            Ya tengo cuenta, iniciar sesión
          </a>
        </form>
      }
    </div>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly siteKey = environment.turnstileSiteKey;

  private readonly turnstileWidget = viewChild<TurnstileWidget>('turnstile');

  protected readonly submitting = signal(false);
  protected readonly registered = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      phone: ['', [Validators.required, colombianPhoneValidator()]],
      documentNumber: ['', [Validators.required, documentNumberValidator()]],
      password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(72), passwordComplexityValidator()]],
      confirmPassword: ['', [Validators.required]],
      acceptsDataProcessing: [false, [Validators.requiredTrue]],
      turnstileToken: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

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
    const { confirmPassword: _confirmPassword, ...request } = this.form.getRawValue();

    this.authService.register(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.registered.set(true);
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        this.handleError(error);
      },
    });
  }

  private handleError(error: AppApiError): void {
    if (error.status === 409) {
      this.formError.set(error.detail);
      return;
    }

    if (error.status === 422) {
      this.formError.set(error.detail);
      this.form.controls.turnstileToken.setValue('');
      this.turnstileWidget()?.reset();
      return;
    }

    if (error.status === 400 && error.errors) {
      for (const entry of error.errors) {
        const { field, message } = splitFieldError(entry);
        const control = this.form.get(field);
        control?.setErrors({ ...(control.errors ?? {}), server: message });
      }
      return;
    }

    this.formError.set(error.detail);
  }
}
