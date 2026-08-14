import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { SIGHTING_STATUS_LABELS, SPECIES_LABELS } from '../../../../core/labels/labels';
import { SightingResponse } from '../../../../core/models';
import { ContactRequestButton } from '../../../../shared/components/contact-request-button/contact-request-button';
import { SightingService } from '../../sighting.service';

@Component({
  selector: 'app-sighting-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, ContactRequestButton],
  template: `
    @if (sighting(); as sighting) {
      <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
        @if (sighting.images.length > 0) {
          <div class="flex gap-2 overflow-x-auto">
            @for (image of sighting.images; track image.id) {
              <img
                [src]="image.url"
                alt=""
                class="h-56 w-56 shrink-0 rounded-2xl object-cover shadow-[0_4px_16px_rgba(47,54,59,0.12)]"
              />
            }
          </div>
        }

        <div class="flex items-center justify-between gap-2">
          <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">
            {{ speciesLabels[sighting.species] }}
          </h1>
          <span class="badge" [class]="statusClass()">{{ statusLabels[sighting.status] }}</span>
        </div>

        <p class="text-sm text-[var(--color-text)]">{{ sighting.description }}</p>
        <p class="text-xs text-[var(--color-text)] opacity-70">
          Visto el {{ sighting.observedAt | date: 'medium' }}
        </p>

        @if (session.isAuthenticated()) {
          <app-contact-request-button publicationType="SIGHTING" [publicationId]="sighting.id" />
        }

        <p class="text-xs text-[var(--color-text)] opacity-60">
          ¿Es tu publicación? Gestiónala desde
          <a routerLink="/sightings/mine" class="btn-link">Mis avistamientos</a>.
        </p>
      </div>
    } @else if (notFound()) {
      <div class="mx-auto max-w-2xl px-4 py-12 text-center text-sm text-[var(--color-text)]">
        No se encontró este avistamiento.
      </div>
    } @else {
      <p class="px-4 py-12 text-center text-sm text-[var(--color-text)]">Cargando…</p>
    }
  `,
})
export class SightingDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly sightingService = inject(SightingService);
  protected readonly session = inject(SessionStore);

  protected readonly statusLabels = SIGHTING_STATUS_LABELS;
  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly sighting = signal<SightingResponse | undefined>(undefined);
  protected readonly notFound = signal(false);

  protected statusClass(): string {
    return this.sighting()?.status === 'ACTIVE'
      ? 'bg-[var(--color-secondary-strong)] text-[var(--color-on-secondary)]'
      : 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]';
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.sightingService.getById(id).subscribe({
      next: (sighting) => this.sighting.set(sighting),
      error: () => this.notFound.set(true),
    });
  }
}
