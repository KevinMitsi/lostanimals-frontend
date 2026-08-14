import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactRequestService } from '../../../features/contact-requests/contact-request.service';
import { AppApiError } from '../../../core/http/problem-detail.util';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PublicationTypeDto } from '../../../core/models';

/**
 * Botón "Solicitar contacto" reutilizable en el detalle de reportes y avistamientos.
 * No sabemos si la publicación es del propio usuario (el backend no expone ownerId en la
 * respuesta pública), así que se muestra siempre que haya sesión y dejamos que el backend
 * rechace el autocontacto si aplica.
 */
@Component({
  selector: 'app-contact-request-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
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
      <button type="button" (click)="open.set(true)" class="btn btn-accent">Solicitar contacto</button>
    }
  `,
})
export class ContactRequestButton {
  readonly publicationType = input.required<PublicationTypeDto>();
  readonly publicationId = input.required<string>();

  private readonly fb = inject(FormBuilder);
  private readonly contactRequestService = inject(ContactRequestService);
  private readonly notifications = inject(NotificationService);

  protected readonly open = signal(false);
  protected readonly sent = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    note: ['', [Validators.required, Validators.maxLength(500)]],
  });

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
