import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { SIGHTING_STATUS_LABELS, SPECIES_LABELS } from '../../../../core/labels/labels';
import { SightingResponse } from '../../../../core/models';
import { SightingService } from '../../sighting.service';

@Component({
  selector: 'app-my-sightings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Mis avistamientos</h1>
        <a routerLink="/sightings/new" class="btn-link">+ Nuevo</a>
      </div>

      @if (formError()) {
        <p class="banner-alert">{{ formError() }}</p>
      }

      @if (loading()) {
        <p class="text-center text-sm text-[var(--color-text)]">Cargando…</p>
      } @else if (items().length === 0) {
        <p class="text-center text-sm text-[var(--color-text)]">Aún no tienes avistamientos.</p>
      }

      <div class="flex flex-col gap-3">
        @for (sighting of items(); track sighting.id) {
          <div class="card-soft flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold">{{ speciesLabels[sighting.species] }}</span>
              <span class="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium">
                {{ statusLabels[sighting.status] }}
              </span>
            </div>
            <span class="text-xs text-[var(--color-text)] opacity-70">
              Visto el {{ sighting.observedAt | date: 'mediumDate' }}
            </span>

            <div class="flex flex-wrap gap-2 text-sm">
              <a [routerLink]="['/sightings', sighting.id, 'edit']" class="btn btn-primary">Editar / imágenes</a>

              @if (sighting.status === 'ACTIVE') {
                <button
                  type="button"
                  [disabled]="pendingId() === sighting.id"
                  (click)="close(sighting)"
                  class="btn btn-alert"
                >
                  Cerrar
                </button>
              }
            </div>
          </div>
        }
      </div>

      @if (nextCursor()) {
        <button type="button" [disabled]="loading()" (click)="loadMore()" class="btn btn-ghost">Cargar más</button>
      }
    </div>
  `,
})
export class MySightingsPage {
  private readonly sightingService = inject(SightingService);

  protected readonly statusLabels = SIGHTING_STATUS_LABELS;
  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly items = signal<SightingResponse[]>([]);
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

  protected close(sighting: SightingResponse): void {
    this.formError.set(null);
    this.pendingId.set(sighting.id);

    this.sightingService.close(sighting.id).subscribe({
      next: () => {
        this.pendingId.set(null);
        this.items.update((list) =>
          list.map((s) => (s.id === sighting.id ? { ...s, status: 'CLOSED' as const } : s)),
        );
      },
      error: (error: AppApiError) => {
        this.pendingId.set(null);
        this.formError.set(error.detail);
      },
    });
  }

  private fetchPage(cursor?: string): void {
    this.loading.set(true);
    this.sightingService.getMine({ cursor, limit: 20 }).subscribe({
      next: (page) => {
        this.loading.set(false);
        this.items.update((list) => [...list, ...page.items]);
        this.nextCursor.set(page.nextCursor);
      },
      error: () => this.loading.set(false),
    });
  }
}
