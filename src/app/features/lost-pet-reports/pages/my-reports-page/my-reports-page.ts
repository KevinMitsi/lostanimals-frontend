import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { REPORT_STATUS_LABELS, SPECIES_LABELS } from '../../../../core/labels/labels';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { LostPetReportResponse } from '../../../../core/models';
import { LostPetReportService } from '../../lost-pet-report.service';

@Component({
  selector: 'app-my-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, ReactiveFormsModule],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Mis reportes</h1>
        <a routerLink="/lost-pet-reports/new" class="btn-link">
          + Nuevo reporte
        </a>
      </div>

      @if (formError()) {
        <p class="banner-alert">
          {{ formError() }}
        </p>
      }

      @if (loading()) {
        <p class="text-center text-sm text-[var(--color-text)]">Cargando…</p>
      } @else if (items().length === 0) {
        <p class="text-center text-sm text-[var(--color-text)]">Aún no tienes reportes.</p>
      }

      <div class="flex flex-col gap-3">
        @for (report of items(); track report.id) {
          <div class="card-soft flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold">{{ report.petName }}</span>
              <span class="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium">
                {{ statusLabels[report.status] }}
              </span>
            </div>
            <span class="text-xs text-[var(--color-text)] opacity-70">
              {{ speciesLabels[report.species] }} · desapareció {{ report.disappearedAt | date: 'mediumDate' }}
            </span>

            <div class="flex flex-wrap gap-2 text-sm">
              <a
                [routerLink]="['/lost-pet-reports', report.id, 'edit']"
                class="btn btn-primary"
              >
                Editar / imágenes
              </a>

              @if (report.status === 'LOST') {
                <button
                  type="button"
                  [disabled]="pendingId() === report.id"
                  (click)="close(report)"
                  class="btn btn-alert"
                >
                  Cerrar
                </button>

                @if (!reunionRequested().has(report.id)) {
                  <button
                    type="button"
                    [disabled]="pendingId() === report.id"
                    (click)="toggleReunionForm(report.id)"
                    class="btn btn-secondary"
                  >
                    ¿La reencontraste?
                  </button>
                } @else {
                  <span class="badge bg-white">Revisión de reencuentro solicitada</span>
                }
              }
              @if (report.status === 'CLOSED') {
                <button
                  type="button"
                  [disabled]="pendingId() === report.id"
                  (click)="reopen(report)"
                  class="btn btn-secondary"
                >
                  Reabrir
                </button>
              }
            </div>

            @if (reunionFormOpenId() === report.id) {
              <form [formGroup]="reunionForm" (ngSubmit)="submitReunionReview(report)" class="card flex flex-col gap-2">
                <label class="field-label">
                  Cuéntale al moderador cómo la reencontraste
                  <textarea formControlName="note" rows="3" class="field-textarea"></textarea>
                </label>
                <div class="flex gap-2">
                  <button type="submit" [disabled]="reunionForm.invalid || pendingId() === report.id" class="btn btn-primary">
                    Enviar solicitud
                  </button>
                  <button type="button" (click)="reunionFormOpenId.set(null)" class="btn btn-ghost">Cancelar</button>
                </div>
              </form>
            }
          </div>
        }
      </div>

      @if (nextCursor()) {
        <button
          type="button"
          [disabled]="loading()"
          (click)="loadMore()"
          class="btn btn-ghost"
        >
          Cargar más
        </button>
      }
    </div>
  `,
})
export class MyReportsPage {
  private readonly reportService = inject(LostPetReportService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly statusLabels = REPORT_STATUS_LABELS;
  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly items = signal<LostPetReportResponse[]>([]);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly pendingId = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);

  protected readonly reunionFormOpenId = signal<string | null>(null);
  protected readonly reunionRequested = signal<Set<string>>(new Set());
  protected readonly reunionForm = this.fb.nonNullable.group({
    note: ['', [Validators.required, Validators.maxLength(500)]],
  });

  constructor() {
    this.fetchPage();
  }

  protected loadMore(): void {
    this.fetchPage(this.nextCursor() ?? undefined);
  }

  protected close(report: LostPetReportResponse): void {
    this.updateStatus(report, 'CLOSED');
  }

  protected reopen(report: LostPetReportResponse): void {
    this.updateStatus(report, 'LOST');
  }

  protected toggleReunionForm(reportId: string): void {
    this.reunionForm.reset({ note: '' });
    this.reunionFormOpenId.set(this.reunionFormOpenId() === reportId ? null : reportId);
  }

  protected submitReunionReview(report: LostPetReportResponse): void {
    if (this.reunionForm.invalid) {
      return;
    }
    this.formError.set(null);
    this.pendingId.set(report.id);

    this.reportService.requestReunionReview(report.id, { note: this.reunionForm.getRawValue().note }).subscribe({
      next: () => {
        this.pendingId.set(null);
        this.reunionFormOpenId.set(null);
        this.reunionRequested.update((set) => new Set(set).add(report.id));
        this.notifications.success('Solicitud de revisión enviada. Un moderador la revisará.');
      },
      error: (error: AppApiError) => {
        this.pendingId.set(null);
        this.formError.set(error.detail);
      },
    });
  }

  private updateStatus(report: LostPetReportResponse, status: 'LOST' | 'CLOSED'): void {
    this.formError.set(null);
    this.pendingId.set(report.id);

    this.reportService.updateStatus(report.id, { status }).subscribe({
      next: () => {
        this.pendingId.set(null);
        this.items.update((list) => list.map((r) => (r.id === report.id ? { ...r, status } : r)));
      },
      error: (error: AppApiError) => {
        this.pendingId.set(null);
        if (error.status === 409) {
          this.formError.set('Este reporte cambió mientras tanto. Recarga la lista antes de reintentar.');
        } else {
          this.formError.set(error.detail);
        }
      },
    });
  }

  private fetchPage(cursor?: string): void {
    this.loading.set(true);
    this.reportService.getMine({ cursor, limit: 20 }).subscribe({
      next: (page) => {
        this.loading.set(false);
        this.items.update((list) => [...list, ...page.items]);
        this.nextCursor.set(page.nextCursor);
      },
      error: () => this.loading.set(false),
    });
  }
}
