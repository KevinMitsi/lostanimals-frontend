import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContactRequestService } from '../../../features/contact-requests/contact-request.service';
import { SessionStore } from '../../../core/auth/session.store';
import { AppApiError } from '../../../core/http/problem-detail.util';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PublicationTypeDto } from '../../../core/models';

/**
 * Botón "Solicitar contacto" reutilizable en el detalle de reportes y avistamientos.
 * No sabemos si la publicación es del propio usuario (el backend no expone ownerId en la
 * respuesta pública), así que se muestra siempre y dejamos que el backend rechace el
 * autocontacto si aplica. Se muestra también a visitantes sin sesión, pero al tocarlo
 * se bloquea con un aviso para iniciar sesión o crear cuenta en vez de abrir el formulario.
 */
@Component({
  selector: 'app-contact-request-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    @if (sent()) {
      <p class="card-soft text-sm">Solicitud de contacto enviada. Espera respuesta en tus mensajes.</p>
    } @else if (open()) {
      <form [formGroup]="form" (ngSubmit)="submit()" class="card flex flex-col gap-3">
        <label class="field-label">
          Mensaje para el dueño
          <textarea
            formControlName="note"
            rows="3"
            class="field-textarea"
            placeholder="Cuéntale por qué crees que es la misma mascota…"
          ></textarea>
        </label>
        @if (errorMessage()) {
          <p class="text-xs text-[var(--color-alert-strong)]">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2">
          <button type="submit" [disabled]="submitting() || form.invalid" class="btn btn-primary">
            {{ submitting() ? 'Enviando…' : 'Enviar solicitud' }}
          </button>
          <button type="button" (click)="open.set(false)" class="btn btn-ghost">Cancelar</button>
        </div>
      </form>
    } @else {
      <button type="button" (click)="onButtonClick()" class="btn btn-accent">Solicitar contacto</button>
    }

    @if (loginPromptOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        (click)="loginPromptOpen.set(false)"
      >
        <div class="card flex w-full max-w-sm flex-col gap-3" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-bold tracking-tight text-[var(--color-primary-strong)]">
            Inicia sesión para continuar
          </h2>
          <p class="text-sm text-[var(--color-text)] opacity-90">
            Para contactar al dueño o a quien reportó este avistamiento, primero necesitas crear una
            cuenta o iniciar sesión.
          </p>
          <div class="flex flex-col gap-2 sm:flex-row">
            <a routerLink="/login" class="btn btn-primary flex-1 text-center">Iniciar sesión</a>
            <a routerLink="/register" class="btn btn-secondary flex-1 text-center">Crear cuenta</a>
          </div>
          <button type="button" (click)="loginPromptOpen.set(false)" class="btn btn-ghost">Cancelar</button>
        </div>
      </div>
    }
  `,
})
export class ContactRequestButton {
  readonly publicationType = input.required<PublicationTypeDto>();
  readonly publicationId = input.required<string>();

  private readonly fb = inject(FormBuilder);
  private readonly contactRequestService = inject(ContactRequestService);
  private readonly notifications = inject(NotificationService);
  protected readonly session = inject(SessionStore);

  protected readonly open = signal(false);
  protected readonly sent = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loginPromptOpen = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    note: ['', [Validators.required, Validators.maxLength(500)]],
  });

  protected onButtonClick(): void {
    if (!this.session.isAuthenticated()) {
      this.loginPromptOpen.set(true);
      return;
    }
    this.open.set(true);
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    this.submitting.set(true);

    this.contactRequestService
      .create({
        publicationType: this.publicationType(),
        publicationId: this.publicationId(),
        note: this.form.getRawValue().note,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.sent.set(true);
          this.notifications.success('Solicitud de contacto enviada.');
        },
        error: (error: AppApiError) => {
          this.submitting.set(false);
          this.errorMessage.set(error.detail);
        },
      });
  }
}
