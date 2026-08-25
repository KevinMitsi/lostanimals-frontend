import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ConversationResponse, MessageResponse } from '../../../../core/models';
import { containsPhoneNumber } from '../../../../core/validators/validators';
import { ConversationSocketService } from '../../conversation-socket.service';
import { ConversationService } from '../../conversation.service';

const ERROR_FRAME_MESSAGES: Record<string, string> = {
  PAYLOAD_TOO_LARGE: 'El mensaje es demasiado largo.',
  VALIDATION_ERROR: 'Revisa el mensaje: no se pudo enviar.',
  FORBIDDEN: 'No tienes permiso para escribir en esta conversación.',
  NOT_FOUND: 'Esta conversación ya no existe.',
};

interface ChatMessageEntry extends MessageResponse {
  readonly kind: 'message';
}

/** Aviso local (nunca se envía al servidor ni lo ve la otra persona). */
interface ChatWarningEntry {
  readonly id: string;
  readonly kind: 'warning';
  readonly content: string;
  readonly createdAt: string;
}

type ChatEntry = ChatMessageEntry | ChatWarningEntry;

@Component({
  selector: 'app-conversation-thread-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto flex h-full max-w-2xl flex-col gap-3 px-4 py-6">
      <div class="flex items-center justify-between gap-2">
        <h1 class="text-xl font-bold tracking-tight text-[var(--color-primary-strong)]">
          {{ otherParticipant() }}
        </h1>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <a routerLink="/conversations" class="btn btn-ghost">Salir</a>
          @if (conversation(); as conversation) {
            @if (conversation.status === 'OPEN') {
              <button type="button" (click)="openEndConversationPrompt()" class="btn btn-ghost">
                Terminar conversación
              </button>
              <button type="button" (click)="block()" class="btn btn-alert">Bloquear</button>
            } @else {
              <span class="badge bg-[var(--color-surface)]">Conversación cerrada</span>
            }
          }
        </div>
      </div>

      @if (formError()) {
        <p class="banner-alert">{{ formError() }}</p>
      }

      <div
        #messageList
        class="flex max-h-[60dvh] flex-col gap-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-[0_2px_14px_rgba(47,54,59,0.08)]"
      >
        @for (entry of messages(); track entry.id) {
          @if (entry.kind === 'warning') {
            <div
              class="mx-auto max-w-[85%] rounded-xl bg-[var(--color-alert)]/15 px-3 py-2 text-center text-xs text-[var(--color-alert-strong)]"
            >
              ⚠️ {{ entry.content }}
            </div>
          } @else {
            <div
              class="max-w-[75%] rounded-2xl px-3 py-2 text-sm"
              [class]="isMine(entry) ? 'ml-auto bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text)]'"
            >
              <p>{{ entry.content }}</p>
              <p class="mt-1 text-[10px] opacity-70">{{ entry.createdAt | date: 'shortTime' }}</p>
            </div>
          }
        }
        @if (messages().length === 0) {
          <p class="text-center text-sm text-[var(--color-text)]">Aún no hay mensajes.</p>
        }
      </div>

      @if (conversation()?.status === 'OPEN') {
        <form [formGroup]="messageForm" (ngSubmit)="send()" class="flex gap-2">
          <input formControlName="content" class="field-input flex-1" placeholder="Escribe un mensaje…" />
          <button type="submit" [disabled]="messageForm.invalid || !connected()" class="btn btn-primary">
            {{ connected() ? 'Enviar' : 'Conectando…' }}
          </button>
        </form>
      }

      @if (!reportOpen()) {
        <button type="button" (click)="reportOpen.set(true)" class="btn-link self-start text-xs">
          Reportar esta conversación
        </button>
      } @else {
        <form [formGroup]="reportForm" (ngSubmit)="submitReport()" class="card flex flex-col gap-2">
          <label class="field-label">
            Motivo
            <input formControlName="reason" class="field-input" placeholder="Ej. acoso, spam…" />
          </label>
          <label class="field-label">
            Detalles
            <textarea formControlName="details" rows="3" class="field-textarea"></textarea>
          </label>
          <div class="flex gap-2">
            <button type="submit" [disabled]="reportForm.invalid" class="btn btn-alert">
              Enviar reporte
            </button>
            <button type="button" (click)="reportOpen.set(false)" class="btn btn-ghost">Cancelar</button>
          </div>
        </form>
      }
    </div>

    @if (endConversationPromptOpen()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div class="card flex w-full max-w-sm flex-col gap-3">
          <h2 class="text-lg font-bold tracking-tight text-[var(--color-alert-strong)]">Terminar conversación</h2>
          <p class="text-sm text-[var(--color-text)]">
            Ya no podrás contactar más con esta persona a menos que vuelva a generarse una nueva
            solicitud de contacto.
          </p>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              [checked]="endConversationAgreed()"
              (change)="endConversationAgreed.set($any($event.target).checked)"
              class="checkbox"
            />
            Estoy de acuerdo
          </label>
          <div class="flex gap-2">
            <button
              type="button"
              [disabled]="!endConversationAgreed()"
              (click)="confirmEndConversation()"
              class="btn btn-alert flex-1"
            >
              Terminar conversación
            </button>
            <button type="button" (click)="endConversationPromptOpen.set(false)" class="btn btn-ghost flex-1">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConversationThreadPage {
  private readonly route = inject(ActivatedRoute);
  private readonly conversationService = inject(ConversationService);
  private readonly socket = inject(ConversationSocketService);
  private readonly session = inject(SessionStore);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly conversationId = this.route.snapshot.paramMap.get('id')!;
  private readonly messageList = viewChild<ElementRef<HTMLDivElement>>('messageList');

  protected readonly conversation = signal<ConversationResponse | undefined>(undefined);
  protected readonly messages = signal<ChatEntry[]>([]);
  protected readonly connected = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly reportOpen = signal(false);
  protected readonly endConversationPromptOpen = signal(false);
  protected readonly endConversationAgreed = signal(false);

  protected readonly messageForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  protected readonly reportForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(40)]],
    details: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  private readonly userId = computed(() => this.session.userId());
  private cursor: string | null = null;

  constructor() {
    this.conversationService.getAll().subscribe((conversations) => {
      this.conversation.set(conversations.find((c) => c.id === this.conversationId));
    });

    this.loadHistory();

    this.socket.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
      this.appendMessages([message]);
    });

    this.socket.errors$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((error) => {
      this.formError.set(ERROR_FRAME_MESSAGES[error.code] ?? 'No se pudo enviar el mensaje.');
    });

    this.socket.reconnected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadHistory();
    });

    this.socket.connectionState$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isOpen) => {
      this.connected.set(isOpen);
    });

    this.socket.connect(this.conversationId);
    this.destroyRef.onDestroy(() => this.socket.disconnect());

    effect(() => {
      this.messages();
      queueMicrotask(() => {
        const el = this.messageList()?.nativeElement;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    });
  }

  protected otherParticipant(): string {
    const conversation = this.conversation();
    if (!conversation) {
      return 'Conversación';
    }
    const other = conversation.participants.find((p) => p.userId !== this.userId());
    return other?.displayName ?? conversation.participants[0]?.displayName ?? 'Usuario';
  }

  protected isMine(message: ChatMessageEntry): boolean {
    return message.senderId === this.userId();
  }

  protected send(): void {
    if (this.messageForm.invalid) {
      return;
    }
    const text = this.messageForm.getRawValue().content;

    if (containsPhoneNumber(text)) {
      this.appendLocalWarning(
        'No es posible enviar información sensible, como números de teléfono, por este medio. Este aviso solo lo puedes ver tú.',
      );
      this.messageForm.reset({ content: '' });
      return;
    }

    this.formError.set(null);
    const sent = this.socket.send(text);
    if (!sent) {
      this.formError.set('Se perdió la conexión en tiempo real. Espera a que se reconecte e intenta de nuevo.');
      return;
    }
    // El servidor difunde el mensaje persistido a este mismo socket; no se agrega copia optimista.
    this.messageForm.reset({ content: '' });
  }

  protected openEndConversationPrompt(): void {
    this.endConversationAgreed.set(false);
    this.endConversationPromptOpen.set(true);
  }

  protected confirmEndConversation(): void {
    if (!this.endConversationAgreed()) {
      return;
    }
    this.conversationService.close(this.conversationId).subscribe({
      next: () => {
        this.patchStatus('CLOSED');
        this.endConversationPromptOpen.set(false);
      },
      error: (error: AppApiError) => this.formError.set(error.detail),
    });
  }

  protected block(): void {
    this.conversationService.block(this.conversationId).subscribe({
      next: () => {
        this.patchStatus('CLOSED');
        this.notifications.success('Usuario bloqueado y conversación cerrada.');
      },
      error: (error: AppApiError) => this.formError.set(error.detail),
    });
  }

  protected submitReport(): void {
    if (this.reportForm.invalid) {
      return;
    }
    const { reason, details } = this.reportForm.getRawValue();
    this.conversationService.report(this.conversationId, { reason, details }).subscribe({
      next: () => {
        this.reportOpen.set(false);
        this.reportForm.reset({ reason: '', details: '' });
        this.notifications.success('Reporte enviado. Un moderador lo revisará.');
      },
      error: (error: AppApiError) => this.formError.set(error.detail),
    });
  }

  private patchStatus(status: ConversationResponse['status']): void {
    const current = this.conversation();
    if (current) {
      this.conversation.set({ ...current, status });
    }
  }

  private loadHistory(): void {
    this.conversationService.getMessages(this.conversationId, this.cursor ?? undefined).subscribe((page) => {
      this.appendMessages(page.items);
      if (page.nextAfter) {
        this.cursor = page.nextAfter;
      }
    });
  }

  private appendMessages(items: readonly MessageResponse[]): void {
    if (items.length === 0) {
      return;
    }
    this.messages.update((list) => {
      const existingIds = new Set(
        list.filter((entry): entry is ChatMessageEntry => entry.kind === 'message').map((m) => m.id),
      );
      const fresh: ChatEntry[] = items
        .filter((item) => !existingIds.has(item.id))
        .map((item) => ({ ...item, kind: 'message' }));
      return fresh.length > 0 ? [...list, ...fresh] : list;
    });
  }

  private appendLocalWarning(content: string): void {
    const entry: ChatWarningEntry = {
      id: crypto.randomUUID(),
      kind: 'warning',
      content,
      createdAt: new Date().toISOString(),
    };
    this.messages.update((list) => [...list, entry]);
  }
}
