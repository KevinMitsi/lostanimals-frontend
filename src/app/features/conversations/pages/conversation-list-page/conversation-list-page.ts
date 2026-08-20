import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { CONVERSATION_STATUS_LABELS } from '../../../../core/labels/labels';
import { ConversationResponse } from '../../../../core/models';
import { ContactRequestService } from '../../../contact-requests/contact-request.service';
import { ConversationService } from '../../conversation.service';

@Component({
  selector: 'app-conversation-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Mensajes</h1>
        <a routerLink="/contact-requests" class="btn btn-ghost relative">
          Solicitudes de contacto
          @if (pendingRequestCount() > 0) {
            <span
              class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-alert)] px-1 text-[10px] font-bold text-[var(--color-on-alert)]"
            >
              {{ pendingRequestCount() }}
            </span>
          }
        </a>
      </div>

      @if (loading()) {
        <p class="text-center text-sm text-[var(--color-text)]">Cargando…</p>
      } @else if (conversations().length === 0) {
        <p class="text-center text-sm text-[var(--color-text)]">Aún no tienes conversaciones.</p>
      }

      <div class="flex flex-col gap-3">
        @for (conversation of conversations(); track conversation.id) {
          <a
            [routerLink]="['/conversations', conversation.id]"
            class="flex items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow-[0_2px_14px_rgba(47,54,59,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(47,54,59,0.14)]"
          >
            <span class="font-semibold text-[var(--color-text)]">{{ otherParticipant(conversation) }}</span>
            <span class="badge" [class]="statusClass(conversation)">{{ statusLabels[conversation.status] }}</span>
          </a>
        }
      </div>
    </div>
  `,
})
export class ConversationListPage {
  private readonly conversationService = inject(ConversationService);
  private readonly contactRequestService = inject(ContactRequestService);
  private readonly session = inject(SessionStore);

  protected readonly statusLabels = CONVERSATION_STATUS_LABELS;
  protected readonly conversations = signal<ConversationResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly pendingRequestCount = signal(0);

  private readonly userId = computed(() => this.session.userId());

  constructor() {
    this.conversationService.getAll().subscribe({
      next: (conversations) => {
        this.loading.set(false);
        this.conversations.set(conversations);
      },
      error: () => this.loading.set(false),
    });

    this.contactRequestService.getReceived().subscribe({
      next: (requests) => {
        this.pendingRequestCount.set(requests.filter((r) => r.status === 'PENDING').length);
      },
    });
  }

  protected otherParticipant(conversation: ConversationResponse): string {
    const other = conversation.participants.find((p) => p.userId !== this.userId());
    return other?.displayName ?? conversation.participants[0]?.displayName ?? 'Usuario';
  }

  protected statusClass(conversation: ConversationResponse): string {
    return conversation.status === 'OPEN'
      ? 'bg-[var(--color-secondary-strong)] text-[var(--color-on-secondary)]'
      : 'bg-[var(--color-surface)] text-[var(--color-text)]';
  }
}
