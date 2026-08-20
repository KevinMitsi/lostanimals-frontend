import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AppApiError, splitFieldError } from '../../../../core/http/problem-detail.util';
import {
  colombianPhoneValidator,
  documentNumberValidator,
  passwordComplexityValidator,
} from '../../../../core/validators/validators';
import { PasswordStrengthChecklist } from '../../../../shared/components/password-strength-checklist/password-strength-checklist';
import { TermsModal } from '../../../../shared/components/terms-modal/terms-modal';
import { TurnstileWidget } from '../../../../shared/components/turnstile-widget/turnstile-widget';
import { GoogleAuthButton } from '../../../../shared/components/google-auth-button/google-auth-button';
import { PhoneInput } from '../../../../shared/components/phone-input/phone-input';
import { AuthService } from '../../auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TurnstileWidget,
    GoogleAuthButton,
    TermsModal,
    PasswordStrengthChecklist,
    PhoneInput,
  ],
  template: `
    <div class="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-10">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Crear cuenta</h1>

      @if (registered()) {
        <div class="card-soft">
          Cuenta creada. Revisa tu correo <strong>{{ form.value.email }}</strong> para verificarla antes de
          iniciar sesión.
          <a routerLink="/login" class="btn-link mt-3 block">Ir a iniciar sesión</a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="card flex flex-col gap-4" novalidate>
          @if (formError()) {
            <p class="banner-alert">
              {{ formError() }}
            </p>
          }

          <label class="field-label">
            Nombre a mostrar
            <input
              type="text"
              formControlName="displayName"
              class="field-input"
            />
            @if (isInvalid('displayName')) {
              <span class="text-xs text-[var(--color-alert-strong)]">
                Debe tener entre 2 y 100 caracteres.
              </span>
            }
          </label>

          <label class="field-label">
            Correo electrónico
            <input
              type="email"
              formControlName="email"
              class="field-input"
            />
            @if (isInvalid('email')) {
              <span class="text-xs text-[var(--color-alert-strong)]">Ingresa un correo válido.</span>
            }
          </label>

          <label class="field-label">
            Teléfono
            <app-phone-input formControlName="phone" />
            @if (isInvalid('phone')) {
              <span class="text-xs text-[var(--color-alert-strong)]">
                Ingresa los 10 dígitos de tu número, empezando en 3.
              </span>
            }
          </label>

          <label class="field-label">
            Número de cédula
            <input
              type="text"
              formControlName="documentNumber"
              class="field-input"
            />
            @if (isInvalid('documentNumber')) {
              <span class="text-xs text-[var(--color-alert-strong)]">Debe tener entre 6 y 10 dígitos.</span>
            }
          </label>

          <label class="field-label relative">
            Contraseña
            <input
              type="password"
              formControlName="password"
              class="field-input"
              (focus)="passwordFocused.set(true)"
              (blur)="passwordFocused.set(false)"
            />
            @if (passwordFocused() || isInvalid('password')) {
              <div class="absolute bottom-full left-0 z-10 mb-2 w-full">
                <app-password-strength-checklist [password]="form.controls.password.value" />
              </div>
            }
          </label>

          <label class="field-label">
            Confirmar contraseña
            <input
              type="password"
              formControlName="confirmPassword"
              class="field-input"
            />
            @if (form.errors?.['passwordsMismatch'] && form.get('confirmPassword')?.touched) {
              <span class="text-xs text-[var(--color-alert-strong)]">Las contraseñas no coinciden.</span>
            }
          </label>

          <p class="text-xs text-[var(--color-text)] opacity-70">
            Para crear tu cuenta (con correo o con Google) necesitamos tratar tus datos personales según
            nuestros
            <button type="button" (click)="termsModal().open()" class="btn-link inline">
              términos y condiciones
            </button>
            .
          </p>
          <label class="flex min-h-[44px] items-center gap-2 text-sm">
            <input type="checkbox" formControlName="acceptsDataProcessing" class="checkbox" />
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
            class="btn btn-primary"
          >
            {{ submitting() ? 'Creando cuenta…' : 'Crear cuenta' }}
          </button>

          <div class="flex items-center gap-3 text-xs text-[var(--color-text)] opacity-60">
            <span class="h-px flex-1 bg-[var(--color-surface)]"></span>
            o
            <span class="h-px flex-1 bg-[var(--color-surface)]"></span>
          </div>

          <app-google-auth-button
            text="signup_with"
            [disabled]="submitting() || !form.controls.acceptsDataProcessing.value"
            (credentialReceived)="onGoogleCredential($event)"
          />

          <a routerLink="/login" class="btn-link block text-center">Ya tengo cuenta, iniciar sesión</a>
        </form>
      }

      <app-terms-modal #termsModalRef />
    </div>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly siteKey = environment.turnstileSiteKey;

  private readonly turnstileWidget = viewChild<TurnstileWidget>('turnstile');
  protected readonly termsModal = viewChild.required<TermsModal>('termsModalRef');

  protected readonly submitting = signal(false);
  protected readonly registered = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly passwordFocused = signal(false);

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

  protected onGoogleCredential(credential: string): void {
    this.formError.set(null);
    const acceptsDataProcessing = this.form.controls.acceptsDataProcessing.value;

    if (!acceptsDataProcessing) {
      this.form.controls.acceptsDataProcessing.markAsTouched();
      this.formError.set('Debes aceptar el tratamiento de datos antes de continuar con Google.');
      return;
    }

    this.submitting.set(true);
    this.authService.authenticateWithGoogle({ credential, acceptsDataProcessing }).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.router.navigateByUrl(result.profileComplete ? '/' : '/complete-profile');
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        this.formError.set(error.detail);
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
