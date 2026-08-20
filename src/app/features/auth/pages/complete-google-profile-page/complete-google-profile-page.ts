import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { colombianPhoneValidator, documentNumberValidator } from '../../../../core/validators/validators';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-complete-google-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-10">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Completa tu perfil</h1>
      <p class="text-sm text-[var(--color-text)] opacity-70">
        Ya iniciaste sesión con Google. Solo necesitamos tu teléfono y número de cédula para terminar de
        crear tu cuenta.
      </p>

      @if (formError()) {
        <p class="banner-alert">{{ formError() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="card flex flex-col gap-4" novalidate>
        <label class="field-label">
          Teléfono (+573XXXXXXXXX)
          <input
            type="tel"
            formControlName="phone"
            placeholder="+573001234567"
            class="field-input"
          />
          @if (isInvalid('phone')) {
            <span class="text-xs text-[var(--color-alert-strong)]">
              Formato colombiano requerido: +573XXXXXXXXX.
            </span>
          }
        </label>

        <label class="field-label">
          Número de cédula
          <input type="text" formControlName="documentNumber" class="field-input" />
          @if (isInvalid('documentNumber')) {
            <span class="text-xs text-[var(--color-alert-strong)]">Debe tener entre 6 y 10 dígitos.</span>
          }
        </label>

        <button type="submit" [disabled]="submitting()" class="btn btn-primary">
          {{ submitting() ? 'Guardando…' : 'Continuar' }}
        </button>
      </form>
    </div>
  `,
})
export class CompleteGoogleProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.required, colombianPhoneValidator()]],
    documentNumber: ['', [Validators.required, documentNumberValidator()]],
  });

  protected isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.authService.completeGoogleProfile(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigateByUrl('/');
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        this.formError.set(error.detail);
      },
    });
  }
}
