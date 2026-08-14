import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { passwordComplexityValidator } from '../../../../core/validators/validators';
import { AuthService } from '../../auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Restablecer contraseña</h1>

      @if (!token()) {
        <p class="text-[var(--color-alert-strong)]">
          Falta el token de recuperación en el enlace.
        </p>
      } @else if (done()) {
        <div class="card-soft">
          Tu contraseña fue actualizada.
          <a routerLink="/login" class="btn-link mt-3 block">
            Iniciar sesión
          </a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="card flex flex-col gap-4" novalidate>
          @if (formError()) {
            <p class="banner-alert">
              {{ formError() }}
            </p>
            <a routerLink="/forgot-password" class="btn-link">
              Solicitar un nuevo enlace
            </a>
          }

          <label class="field-label">
            Nueva contraseña
            <input
              type="password"
              formControlName="newPassword"
              class="field-input"
            />
            @if (isInvalid('newPassword')) {
              <span class="text-xs text-[var(--color-alert-strong)]">
                12-72 caracteres, con mayúscula, minúscula y número.
              </span>
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

          <button
            type="submit"
            [disabled]="submitting()"
            class="btn btn-primary"
          >
            {{ submitting() ? 'Guardando…' : 'Restablecer contraseña' }}
          </button>
        </form>
      }
    </div>
  `,
})
export class ResetPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly token = signal(this.route.snapshot.queryParamMap.get('token'));
  protected readonly submitting = signal(false);
  protected readonly done = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(72), passwordComplexityValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    this.formError.set(null);

    const token = this.token();
    if (!token || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.authService.resetPassword({ token, newPassword: this.form.getRawValue().newPassword }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.done.set(true);
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        this.formError.set(error.detail);
      },
    });
  }
}
