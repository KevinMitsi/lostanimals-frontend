import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { REPORT_STATUS_LABELS, SPECIES_LABELS } from '../../../../core/labels/labels';
import { LostPetReportResponse } from '../../../../core/models';
import { ContactRequestButton } from '../../../../shared/components/contact-request-button/contact-request-button';
import { NeighborhoodLabel } from '../../../../shared/components/neighborhood-label/neighborhood-label';
import { LostPetReportService } from '../../lost-pet-report.service';

@Component({
  selector: 'app-report-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, ContactRequestButton, NeighborhoodLabel],
  template: `
    @if (report(); as report) {
      <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
        @if (report.images.length > 0) {
          <div class="flex gap-2 overflow-x-auto">
            @for (image of report.images; track image.id) {
              <img [src]="image.url" alt="" class="h-56 w-56 shrink-0 rounded-2xl object-cover shadow-[0_4px_16px_rgba(47,54,59,0.12)]" />
            }
          </div>
        }

        <div class="flex items-center justify-between gap-2">
          <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">{{ report.petName }}</h1>
          <span class="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium">
            {{ statusLabels[report.status] }}
          </span>
        </div>

        <p class="text-sm text-[var(--color-text)]">{{ speciesLabels[report.species] }}</p>
        <p class="text-sm text-[var(--color-text)]">{{ report.description }}</p>
        <p class="text-xs text-[var(--color-text)] opacity-70">
          Desapareció el {{ report.disappearedAt | date: 'medium' }}
        </p>
        <p class="text-xs text-[var(--color-text)] opacity-70">
          <app-neighborhood-label [neighborhoodId]="report.neighborhoodId" />
        </p>

        @if (session.isAuthenticated()) {
          <app-contact-request-button publicationType="LOST_PET_REPORT" [publicationId]="report.id" />
        }

        <p class="text-xs text-[var(--color-text)] opacity-60">
          ¿Es tu publicación? Gestiónala desde
          <a routerLink="/lost-pet-reports/mine" class="btn-link">
            Mis reportes
          </a>.
        </p>
      </div>
    } @else if (notFound()) {
      <div class="mx-auto max-w-2xl px-4 py-12 text-center text-sm text-[var(--color-text)]">
        No se encontró este reporte.
      </div>
    } @else {
      <p class="px-4 py-12 text-center text-sm text-[var(--color-text)]">Cargando…</p>
    }
  `,
})
export class ReportDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(LostPetReportService);
  protected readonly session = inject(SessionStore);

  protected readonly statusLabels = REPORT_STATUS_LABELS;
  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly report = signal<LostPetReportResponse | undefined>(undefined);
  protected readonly notFound = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.reportService.getById(id).subscribe({
      next: (report) => this.report.set(report),
      error: () => this.notFound.set(true),
    });
  }
}
