import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SessionStore } from '../../../../core/auth/session.store';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ConversationResponse, MessageResponse } from '../../../../core/models';
import { ConversationService } from '../../conversation.service';

const POLL_INTERVAL_MS = 6000;

@Component({
  selector: 'app-conversation-thread-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="mx-auto flex h-full max-w-2xl flex-col gap-3 px-4 py-6">
      <div class="flex items-center justify-between gap-2">
        <h1 class="text-xl font-bold tracking-tight text-[var(--color-primary-strong)]">
          {{ otherParticipant() }}
        </h1>
        @if (conversation(); as conversation) {
          @if (conversation.status === 'OPEN') {
            <div class="flex gap-2">
              <button type="button" (click)="close()" class="btn btn-ghost">Cerrar</button>
              <button type="button" (click)="block()" class="btn btn-alert">Bloquear</button>
            </div>
          } @else {
            <span class="badge bg-[var(--color-surface)]">Conversación cerrada</span>
          }
        }
      </div>

      @if (formError()) {
        <p class="banner-alert">{{ formError() }}</p>
      }

      <div class="flex flex-1 flex-col gap-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-[0_2px_14px_rgba(47,54,59,0.08)]">
        @for (message of messages(); track message.id) {
          <div
            class="max-w-[75%] rounded-2xl px-3 py-2 text-sm"
            [class]="isMine(message) ? 'ml-auto bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text)]'"
          >
            <p>{{ message.content }}</p>
            <p class="mt-1 text-[10px] opacity-70">{{ message.createdAt | date: 'shortTime' }}</p>
          </div>
        }
        @if (messages().length === 0) {
          <p class="text-center text-sm text-[var(--color-text)]">Aún no hay mensajes.</p>
        }
      </div>

      @if (conversation()?.status === 'OPEN') {
        <form [formGroup]="messageForm" (ngSubmit)="send()" class="flex gap-2">
          <input formControlName="content" class="field-input flex-1" placeholder="Escribe un mensaje…" />
          <button type="submit" [disabled]="messageForm.invalid || sending()" class="btn btn-primary">Enviar</button>
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
  `,
})
export class ConversationThreadPage {
  private readonly route = inject(ActivatedRoute);
  private readonly conversationService = inject(ConversationService);
  private readonly session = inject(SessionStore);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly conversationId = this.route.snapshot.paramMap.get('id')!;

  protected readonly conversation = signal<ConversationResponse | undefined>(undefined);
  protected readonly messages = signal<MessageResponse[]>([]);
  protected readonly sending = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly reportOpen = signal(false);

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

    timer(0, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.conversationService.getMessages(this.conversationId, this.cursor ?? undefined)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          if (page.items.length > 0) {
            this.messages.update((list) => [...list, ...page.items]);
          }
          if (page.nextAfter) {
            this.cursor = page.nextAfter;
          }
        },
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

  protected isMine(message: MessageResponse): boolean {
    return message.senderId === this.userId();
  }

  protected send(): void {
    if (this.messageForm.invalid) {
      return;
    }
    this.formError.set(null);
    this.sending.set(true);
    const text = this.messageForm.getRawValue().content;

    this.conversationService.sendMessage(this.conversationId, { content: text }).subscribe({
      next: (response) => {
        this.sending.set(false);
        this.messageForm.reset({ content: '' });
        this.messages.update((list) => [
          ...list,
          { id: response.id, senderId: this.userId() ?? '', content: text, createdAt: new Date().toISOString() },
        ]);
      },
      error: (error: AppApiError) => {
        this.sending.set(false);
        this.formError.set(error.detail);
      },
    });
  }

  protected close(): void {
    this.conversationService.close(this.conversationId).subscribe({
      next: () => this.patchStatus('CLOSED'),
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
}
