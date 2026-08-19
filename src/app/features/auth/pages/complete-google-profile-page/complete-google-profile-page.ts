import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { AppApiError, splitFieldError } from '../../../../core/http/problem-detail.util';
import { colombianPhoneValidator, documentNumberValidator } from '../../../../core/validators/validators';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-complete-google-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-10">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">
          Completa tu perfil
        </h1>
        <p class="mt-2 text-sm opacity-75">
          Google nos entregó tu nombre y correo. Necesitamos estos dos datos para habilitar tu cuenta.
        </p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="card flex flex-col gap-4" novalidate>
        @if (formError()) { <p class="banner-alert">{{ formError() }}</p> }

        <label class="field-label">
          Teléfono (+573XXXXXXXXX)
          <input type="tel" formControlName="phone" placeholder="+573001234567" class="field-input" />
          @if (isInvalid('phone')) {
            <span class="text-xs text-[var(--color-alert-strong)]">Formato requerido: +573XXXXXXXXX.</span>
          }
        </label>

        <label class="field-label">
          Número de cédula
          <input type="text" formControlName="documentNumber" inputmode="numeric" class="field-input" />
          @if (isInvalid('documentNumber')) {
            <span class="text-xs text-[var(--color-alert-strong)]">Debe tener entre 6 y 10 dígitos.</span>
          }
        </label>

        <button type="submit" [disabled]="submitting()" class="btn btn-primary">
          {{ submitting() ? 'Guardando…' : 'Completar perfil' }}
        </button>
      </form>
    </div>
  `,
})
export class CompleteGoogleProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.required, colombianPhoneValidator()]],
    documentNumber: ['', [Validators.required, documentNumberValidator()]],
  });

  constructor() {
    if (this.session.profileComplete()) this.router.navigateByUrl('/');
  }

  protected isInvalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.completeGoogleProfile(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigateByUrl('/');
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        if (error.status === 400 && error.errors) {
          for (const entry of error.errors) {
            const { field, message } = splitFieldError(entry);
            this.form.get(field)?.setErrors({ server: message });
          }
        } else {
          this.formError.set(error.detail);
        }
      },
    });
  }
}
