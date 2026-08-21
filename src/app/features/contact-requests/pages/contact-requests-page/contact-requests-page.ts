import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  CONTACT_REQUEST_STATUS_LABELS,
  PUBLICATION_TYPE_LABELS,
} from '../../../../core/labels/labels';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { ContactRequestResponse } from '../../../../core/models';
import { SafetyWarningModal } from '../../../../shared/components/safety-warning-modal/safety-warning-modal';
import { ContactRequestService } from '../../contact-request.service';

type Tab = 'received' | 'sent';

@Component({
  selector: 'app-contact-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, SafetyWarningModal],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Solicitudes de contacto</h1>

      <div class="flex gap-2 rounded-full bg-white p-1 shadow-[0_2px_10px_rgba(47,54,59,0.08)]">
        <button
          type="button"
          (click)="switchTab('received')"
          class="flex-1 rounded-full py-2 text-sm font-semibold transition-colors"
          [class]="tab() === 'received' ? 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'text-[var(--color-text)]'"
        >
          Recibidas
        </button>
        <button
          type="button"
          (click)="switchTab('sent')"
          class="flex-1 rounded-full py-2 text-sm font-semibold transition-colors"
          [class]="tab() === 'sent' ? 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'text-[var(--color-text)]'"
        >
          Enviadas
        </button>
      </div>

      @if (formError()) {
        <p class="banner-alert">{{ formError() }}</p>
      }

      @if (loading()) {
        <p class="text-center text-sm text-[var(--color-text)]">Cargando…</p>
      } @else if (items().length === 0) {
        <p class="text-center text-sm text-[var(--color-text)]">
          {{ tab() === 'received' ? 'No has recibido solicitudes de contacto.' : 'No has enviado solicitudes de contacto.' }}
        </p>
      }

      <div class="flex flex-col gap-3">
        @for (item of items(); track item.id) {
          <div class="card-soft flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold">{{ publicationTypeLabels[item.publicationType] }}</span>
              <span class="badge bg-white">{{ statusLabels[item.status] }}</span>
            </div>
            <p class="text-sm text-[var(--color-text)]">{{ item.note }}</p>
            <span class="text-xs text-[var(--color-text)] opacity-70">
              {{ item.createdAt | date: 'medium' }}
            </span>

            @if (tab() === 'received' && item.status === 'PENDING') {
              <div class="flex gap-2">
                <button
                  type="button"
                  [disabled]="pendingId() === item.id"
                  (click)="accept(item)"
                  class="btn btn-primary"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  [disabled]="pendingId() === item.id"
                  (click)="reject(item)"
                  class="btn btn-alert"
                >
                  Rechazar
                </button>
              </div>
            }

            @if (tab() === 'sent' && item.status === 'PENDING') {
              <button
                type="button"
                [disabled]="pendingId() === item.id"
                (click)="cancel(item)"
                class="btn btn-ghost"
              >
                Cancelar solicitud
              </button>
            }
          </div>
        }
      </div>
    </div>

    <app-safety-warning-modal (confirmed)="goToAcceptedConversation()" />
  `,
})
export class ContactRequestsPage {
  private readonly contactRequestService = inject(ContactRequestService);
  private readonly router = inject(Router);
  private readonly safetyModal = viewChild.required(SafetyWarningModal);
  private acceptedConversationId: string | null = null;

  protected readonly statusLabels = CONTACT_REQUEST_STATUS_LABELS;
  protected readonly publicationTypeLabels = PUBLICATION_TYPE_LABELS;

  protected readonly tab = signal<Tab>('received');
  protected readonly items = signal<ContactRequestResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly pendingId = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    this.fetch();
  }

  protected switchTab(tab: Tab): void {
    if (this.tab() === tab) {
      return;
    }
    this.tab.set(tab);
    this.fetch();
  }

  protected accept(item: ContactRequestResponse): void {
    this.formError.set(null);
    this.pendingId.set(item.id);

    this.contactRequestService.accept(item.id).subscribe({
      next: (response) => {
        this.pendingId.set(null);
        this.acceptedConversationId = response.id;
        this.safetyModal().open();
      },
      error: (error: AppApiError) => {
        this.pendingId.set(null);
        this.formError.set(error.detail);
      },
    });
  }

  protected goToAcceptedConversation(): void {
    if (this.acceptedConversationId) {
      this.router.navigate(['/conversations', this.acceptedConversationId]);
    }
  }

  protected reject(item: ContactRequestResponse): void {
    this.updateStatus(item, 'REJECTED', () => this.contactRequestService.reject(item.id));
  }

  protected cancel(item: ContactRequestResponse): void {
    this.updateStatus(item, 'CANCELED', () => this.contactRequestService.cancel(item.id));
  }

  private updateStatus(
    item: ContactRequestResponse,
    nextStatus: ContactRequestResponse['status'],
    action: () => Observable<void>,
  ): void {
    this.formError.set(null);
    this.pendingId.set(item.id);

    action().subscribe({
      next: () => {
        this.pendingId.set(null);
        this.items.update((list) => list.map((r) => (r.id === item.id ? { ...r, status: nextStatus } : r)));
      },
      error: (error: AppApiError) => {
        this.pendingId.set(null);
        this.formError.set(error.detail);
      },
    });
  }

  private fetch(): void {
    this.loading.set(true);
    const request$ =
      this.tab() === 'received' ? this.contactRequestService.getReceived() : this.contactRequestService.getSent();

    request$.subscribe({
      next: (items) => {
        this.loading.set(false);
        this.items.set(items);
      },
      error: () => this.loading.set(false),
    });
  }
}
