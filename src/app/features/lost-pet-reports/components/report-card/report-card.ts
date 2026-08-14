import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { REPORT_STATUS_LABELS, SPECIES_LABELS } from '../../../../core/labels/labels';
import { LostPetReportResponse } from '../../../../core/models';

@Component({
  selector: 'app-report-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="['/lost-pet-reports', report().id]"
      class="flex gap-3 rounded-lg bg-[var(--color-surface)] p-3 hover:opacity-90"
    >
      <div class="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-white">
        @if (primaryImageUrl(); as url) {
          <img [src]="url" alt="" class="h-full w-full object-cover" />
        }
      </div>

      <div class="flex flex-1 flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-[var(--color-text)]">{{ report().petName }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-medium"
            [class]="statusClass()"
          >
            {{ statusLabel() }}
          </span>
        </div>
        <span class="text-sm text-[var(--color-text)]">{{ speciesLabel() }}</span>
        <span class="text-xs text-[var(--color-text)] opacity-70">
          Desapareció el {{ report().disappearedAt | date: 'mediumDate' }}
        </span>
      </div>
    </a>
  `,
})
export class ReportCard {
  readonly report = input.required<LostPetReportResponse>();

  protected readonly primaryImageUrl = computed(() => {
    const images = this.report().images;
    return (images.find((img) => img.primary) ?? images[0])?.url ?? null;
  });

  protected readonly speciesLabel = computed(() => SPECIES_LABELS[this.report().species]);
  protected readonly statusLabel = computed(() => REPORT_STATUS_LABELS[this.report().status]);

  protected readonly statusClass = computed(() => {
    switch (this.report().status) {
      case 'LOST':
        return 'bg-[var(--color-alert)] text-[var(--color-on-alert)]';
      case 'REUNITED':
        return 'bg-[var(--color-secondary-strong)] text-[var(--color-on-secondary)]';
      default:
        return 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]';
    }
  });
}
