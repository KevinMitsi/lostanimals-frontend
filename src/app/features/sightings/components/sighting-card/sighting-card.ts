import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SIGHTING_STATUS_LABELS, SPECIES_LABELS } from '../../../../core/labels/labels';
import { SightingResponse } from '../../../../core/models';

@Component({
  selector: 'app-sighting-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="['/sightings', sighting().id]"
      class="flex gap-3 rounded-2xl bg-white p-3 shadow-[0_2px_14px_rgba(47,54,59,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(47,54,59,0.14)]"
    >
      <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface)]">
        @if (primaryImageUrl(); as url) {
          <img [src]="url" alt="" class="h-full w-full object-cover" />
        }
      </div>

      <div class="flex flex-1 flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-[var(--color-text)]">{{ speciesLabel() }}</span>
          <span class="badge" [class]="statusClass()">{{ statusLabel() }}</span>
        </div>
        <span class="line-clamp-2 text-sm text-[var(--color-text)]">{{ sighting().description }}</span>
        <span class="text-xs text-[var(--color-text)] opacity-70">
          Visto el {{ sighting().observedAt | date: 'mediumDate' }}
        </span>
      </div>
    </a>
  `,
})
export class SightingCard {
  readonly sighting = input.required<SightingResponse>();

  protected readonly primaryImageUrl = computed(() => {
    const images = this.sighting().images;
    return (images.find((img) => img.primary) ?? images[0])?.url ?? null;
  });

  protected readonly speciesLabel = computed(() => SPECIES_LABELS[this.sighting().species]);
  protected readonly statusLabel = computed(() => SIGHTING_STATUS_LABELS[this.sighting().status]);

  protected readonly statusClass = computed(() =>
    this.sighting().status === 'ACTIVE'
      ? 'bg-[var(--color-secondary-strong)] text-[var(--color-on-secondary)]'
      : 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]',
  );
}
