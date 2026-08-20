import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SIGHTING_STATUS_LABELS, SPECIES_LABELS } from '../../../../core/labels/labels';
import { SightingResponse } from '../../../../core/models';

const SWIPE_THRESHOLD = 40;

@Component({
  selector: 'app-sighting-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [RouterLink, DatePipe],
  template: `
    <a
      [routerLink]="['/sightings', sighting().id]"
      class="block overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(47,54,59,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(47,54,59,0.14)]"
    >
      <div
        class="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-surface)]"
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)"
      >
        @if (images().length > 0) {
          <img [src]="images()[activeIndex()].url" alt="" class="h-full w-full object-cover" />
        } @else {
          <div class="flex h-full w-full items-center justify-center text-5xl opacity-40">🐾</div>
        }

        <span class="badge absolute left-3 top-3 shadow-[0_2px_10px_rgba(47,54,59,0.25)]" [class]="statusClass()">
          {{ statusLabel() }}
        </span>

        @if (images().length > 1) {
          <button
            type="button"
            (click)="prev($event)"
            class="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-lg text-white backdrop-blur-sm"
            aria-label="Imagen anterior"
          >
            ‹
          </button>
          <button
            type="button"
            (click)="next($event)"
            class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-lg text-white backdrop-blur-sm"
            aria-label="Siguiente imagen"
          >
            ›
          </button>

          <div class="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            @for (image of images(); track image.id; let i = $index) {
              <span
                class="h-1.5 rounded-full transition-all"
                [class]="i === activeIndex() ? 'w-4 bg-white' : 'w-1.5 bg-white/50'"
              ></span>
            }
          </div>
        }
      </div>

      <div class="flex flex-col gap-2 p-4">
        <h3 class="text-lg font-bold tracking-tight text-[var(--color-primary-strong)]">
          {{ speciesLabel() }}
        </h3>

        <p class="line-clamp-2 text-sm text-[var(--color-text)] opacity-80">
          {{ sighting().description }}
        </p>

        <p class="text-xs text-[var(--color-text)] opacity-60">
          📅 Visto el {{ sighting().observedAt | date: 'medium' }}
        </p>
      </div>
    </a>
  `,
})
export class SightingCard {
  readonly sighting = input.required<SightingResponse>();

  protected readonly images = computed(() => this.sighting().images);
  protected readonly activeIndex = signal(0);

  protected readonly speciesLabel = computed(() => SPECIES_LABELS[this.sighting().species]);
  protected readonly statusLabel = computed(() => SIGHTING_STATUS_LABELS[this.sighting().status]);

  protected readonly statusClass = computed(() =>
    this.sighting().status === 'ACTIVE'
      ? 'bg-[var(--color-secondary-strong)] text-[var(--color-on-secondary)]'
      : 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]',
  );

  private touchStartX = 0;

  protected prev(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const count = this.images().length;
    this.activeIndex.update((i) => (i - 1 + count) % count);
  }

  protected next(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const count = this.images().length;
    this.activeIndex.update((i) => (i + 1) % count);
  }

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
  }

  protected onTouchEnd(event: TouchEvent): void {
    if (this.images().length < 2) {
      return;
    }
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    const count = this.images().length;
    if (deltaX <= -SWIPE_THRESHOLD) {
      this.activeIndex.update((i) => (i + 1) % count);
    } else if (deltaX >= SWIPE_THRESHOLD) {
      this.activeIndex.update((i) => (i - 1 + count) % count);
    }
  }
}
