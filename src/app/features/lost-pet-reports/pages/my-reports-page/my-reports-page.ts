import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { REPORT_STATUS_LABELS, SPECIES_LABELS } from '../../../../core/labels/labels';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { LostPetReportResponse } from '../../../../core/models';
import { LostPetReportService } from '../../lost-pet-report.service';

@Component({
  selector: 'app-my-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-[var(--color-primary-strong)]">Mis reportes</h1>
        <a routerLink="/lost-pet-reports/new" class="text-sm font-semibold text-[var(--color-primary-strong)]">
          + Nuevo reporte
        </a>
      </div>

      @if (formError()) {
        <p class="rounded-md bg-[var(--color-alert)] px-3 py-2 text-sm text-[var(--color-on-alert)]">
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
          <div class="flex flex-col gap-2 rounded-lg bg-[var(--color-surface)] p-3">
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
                class="min-h-[44px] rounded-md bg-[var(--color-primary-strong)] px-3 py-2 text-[var(--color-on-primary)]"
              >
                Editar / imágenes
              </a>

              @if (report.status === 'LOST') {
                <button
                  type="button"
                  [disabled]="pendingId() === report.id"
                  (click)="close(report)"
                  class="min-h-[44px] rounded-md bg-[var(--color-alert)] px-3 py-2 text-[var(--color-on-alert)] disabled:opacity-60"
                >
                  Cerrar
                </button>
              }
              @if (report.status === 'CLOSED') {
                <button
                  type="button"
                  [disabled]="pendingId() === report.id"
                  (click)="reopen(report)"
                  class="min-h-[44px] rounded-md bg-[var(--color-secondary-strong)] px-3 py-2 text-[var(--color-on-secondary)] disabled:opacity-60"
                >
                  Reabrir
                </button>
              }
            </div>
          </div>
        }
      </div>

      @if (nextCursor()) {
        <button
          type="button"
          [disabled]="loading()"
          (click)="loadMore()"
          class="min-h-[44px] rounded-md bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] disabled:opacity-60"
        >
          Cargar más
        </button>
      }
    </div>
  `,
})
export class MyReportsPage {
  private readonly reportService = inject(LostPetReportService);

  protected readonly statusLabels = REPORT_STATUS_LABELS;
  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly items = signal<LostPetReportResponse[]>([]);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly pendingId = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);

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
