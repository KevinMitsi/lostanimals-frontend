import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CONVERSATION_REPORT_STATUS_LABELS,
  REUNION_REVIEW_STATUS_LABELS,
} from '../../../../core/labels/labels';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { ConversationReportResponse, ReunionReviewResponse } from '../../../../core/models';
import { ModeratorService } from '../../moderator.service';

type Tab = 'reunions' | 'reports';

@Component({
  selector: 'app-moderator-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Panel de moderación</h1>

      <div class="flex gap-2 rounded-full bg-white p-1 shadow-[0_2px_10px_rgba(47,54,59,0.08)]">
        <button
          type="button"
          (click)="switchTab('reunions')"
          class="flex-1 rounded-full py-2 text-sm font-semibold transition-colors"
          [class]="tab() === 'reunions' ? 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'text-[var(--color-text)]'"
        >
          Reuniones pendientes
        </button>
        <button
          type="button"
          (click)="switchTab('reports')"
          class="flex-1 rounded-full py-2 text-sm font-semibold transition-colors"
          [class]="tab() === 'reports' ? 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'text-[var(--color-text)]'"
        >
          Reportes de conversación
        </button>
      </div>

      @if (formError()) {
        <p class="banner-alert">{{ formError() }}</p>
      }

      @if (loading()) {
        <p class="text-center text-sm text-[var(--color-text)]">Cargando…</p>
      }

      @if (tab() === 'reunions') {
        @if (!loading() && reunionReviews().length === 0) {
          <p class="text-center text-sm text-[var(--color-text)]">No hay revisiones de reencuentro pendientes.</p>
        }

        <div class="flex flex-col gap-3">
          @for (review of reunionReviews(); track review.id) {
            <div class="card-soft flex flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold">{{ review.ownerName }}</span>
                <span class="badge bg-white">{{ reunionStatusLabels[review.status] }}</span>
              </div>
              <span class="text-xs text-[var(--color-text)] opacity-70">Tel: {{ review.ownerPhone }}</span>
              <p class="text-sm text-[var(--color-text)]">{{ review.requestNote }}</p>
              <span class="text-xs text-[var(--color-text)] opacity-70">{{ review.createdAt | date: 'medium' }}</span>

              @if (review.status === 'PENDING') {
                <div class="flex gap-2">
                  <button type="button" (click)="openDecision(review.id, true)" class="btn btn-primary">Aprobar</button>
                  <button type="button" (click)="openDecision(review.id, false)" class="btn btn-alert">Rechazar</button>
                </div>

                @if (decisionOpenId() === review.id) {
                  <form [formGroup]="decisionForm" (ngSubmit)="submitDecision(review)" class="card flex flex-col gap-2">
                    <label class="field-label">
                      Nota para el dueño ({{ decisionApproved() ? 'aprobación' : 'rechazo' }})
                      <textarea formControlName="note" rows="2" class="field-textarea"></textarea>
                    </label>
                    <div class="flex gap-2">
                      <button type="submit" [disabled]="decisionForm.invalid || pendingId() === review.id" class="btn btn-primary">
                        Confirmar
                      </button>
                      <button type="button" (click)="decisionOpenId.set(null)" class="btn btn-ghost">Cancelar</button>
                    </div>
                  </form>
                }
              }
            </div>
          }
        </div>
      }

      @if (tab() === 'reports') {
        @if (!loading() && conversationReports().length === 0) {
          <p class="text-center text-sm text-[var(--color-text)]">No hay reportes de conversación pendientes.</p>
        }

        <div class="flex flex-col gap-3">
          @for (report of conversationReports(); track report.id) {
            <div class="card-soft flex flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold">{{ report.reason }}</span>
                <span class="badge bg-white">{{ reportStatusLabels[report.status] }}</span>
              </div>
              <p class="text-sm text-[var(--color-text)]">{{ report.details }}</p>
              <span class="text-xs text-[var(--color-text)] opacity-70">{{ report.createdAt | date: 'medium' }}</span>

              @if (report.status === 'PENDING') {
                <div class="flex gap-2">
                  <button
                    type="button"
                    [disabled]="pendingId() === report.id"
                    (click)="decideReport(report, true)"
                    class="btn btn-primary"
                  >
                    Resolver
                  </button>
                  <button
                    type="button"
                    [disabled]="pendingId() === report.id"
                    (click)="decideReport(report, false)"
                    class="btn btn-ghost"
                  >
                    Descartar
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ModeratorPage {
  private readonly moderatorService = inject(ModeratorService);
  private readonly fb = inject(FormBuilder);

  protected readonly reunionStatusLabels = REUNION_REVIEW_STATUS_LABELS;
  protected readonly reportStatusLabels = CONVERSATION_REPORT_STATUS_LABELS;

  protected readonly tab = signal<Tab>('reunions');
  protected readonly loading = signal(true);
  protected readonly formError = signal<string | null>(null);
  protected readonly pendingId = signal<string | null>(null);

  protected readonly reunionReviews = signal<ReunionReviewResponse[]>([]);
  protected readonly conversationReports = signal<ConversationReportResponse[]>([]);

  protected readonly decisionOpenId = signal<string | null>(null);
  protected readonly decisionApproved = signal(true);
  protected readonly decisionForm = this.fb.nonNullable.group({
    note: ['', [Validators.required, Validators.maxLength(1000)]],
  });

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

  protected openDecision(reviewId: string, approved: boolean): void {
    this.decisionForm.reset({ note: '' });
    this.decisionApproved.set(approved);
    this.decisionOpenId.set(reviewId);
  }

  protected submitDecision(review: ReunionReviewResponse): void {
    if (this.decisionForm.invalid) {
      return;
    }
    this.formError.set(null);
    this.pendingId.set(review.id);
    const approved = this.decisionApproved();

    this.moderatorService
      .decideReunionReview(review.id, { approved, note: this.decisionForm.getRawValue().note })
      .subscribe({
        next: () => {
          this.pendingId.set(null);
          this.decisionOpenId.set(null);
          this.reunionReviews.update((list) =>
            list.map((r) => (r.id === review.id ? { ...r, status: approved ? 'APPROVED' : 'REJECTED' } : r)),
          );
        },
        error: (error: AppApiError) => {
          this.pendingId.set(null);
          this.formError.set(error.detail);
        },
      });
  }

  protected decideReport(report: ConversationReportResponse, resolved: boolean): void {
    this.formError.set(null);
    this.pendingId.set(report.id);

    this.moderatorService.decideConversationReport(report.id, { resolved }).subscribe({
      next: () => {
        this.pendingId.set(null);
        this.conversationReports.update((list) =>
          list.map((r) => (r.id === report.id ? { ...r, status: resolved ? 'RESOLVED' : 'DISMISSED' } : r)),
        );
      },
      error: (error: AppApiError) => {
        this.pendingId.set(null);
        this.formError.set(error.detail);
      },
    });
  }

  private fetch(): void {
    this.loading.set(true);
    this.formError.set(null);

    if (this.tab() === 'reunions') {
      this.moderatorService.getReunionReviews().subscribe({
        next: (items) => {
          this.loading.set(false);
          this.reunionReviews.set(items);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.moderatorService.getConversationReports().subscribe({
        next: (items) => {
          this.loading.set(false);
          this.conversationReports.set(items);
        },
        error: () => this.loading.set(false),
      });
    }
  }
}
