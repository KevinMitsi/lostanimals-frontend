import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { LostPetReportResponse, ReportSearchRequest, ReportStatusDto, SpeciesDto } from '../../../../core/models';
import {
  GeographyCascadeSelector,
  GeographyLocationValue,
} from '../../../../shared/components/geography-cascade-selector/geography-cascade-selector';
import { ReportCard } from '../../components/report-card/report-card';
import { LostPetReportService } from '../../lost-pet-report.service';

const EMPTY_LOCATION: GeographyLocationValue = { departmentId: null, cityId: null, neighborhoodId: null };
const DEFAULT_RADIUS_METERS = 5000;

@Component({
  selector: 'app-report-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ReportCard, GeographyCascadeSelector],
  template: `
    <div class="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <div class="flex items-center justify-between gap-2">
        <h1 class="text-2xl font-semibold text-[var(--color-primary-strong)]">Mascotas perdidas</h1>
        @if (session.isAuthenticated()) {
          <a routerLink="/lost-pet-reports/mine" class="text-sm font-semibold text-[var(--color-primary-strong)]">
            Mis reportes
          </a>
        }
      </div>

      <form [formGroup]="filtersForm" (ngSubmit)="applyFilters()" class="flex flex-col gap-3 rounded-lg bg-[var(--color-surface)] p-4">
        <div class="flex flex-col gap-3 sm:flex-row">
          <label class="flex flex-1 flex-col gap-1 text-sm">
            Especie
            <select formControlName="species" class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3">
              <option value="">Todas</option>
              <option value="DOG">Perro</option>
              <option value="CAT">Gato</option>
              <option value="BIRD">Ave</option>
              <option value="OTHER">Otro</option>
            </select>
          </label>

          <label class="flex flex-1 flex-col gap-1 text-sm">
            Estado
            <select formControlName="status" class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3">
              <option value="">Todos</option>
              <option value="LOST">Perdido</option>
              <option value="REUNITED">Reencontrado</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </label>
        </div>

        <app-geography-cascade-selector formControlName="location" />

        <div class="flex flex-col gap-3 sm:flex-row">
          <label class="flex flex-1 flex-col gap-1 text-sm">
            Desde
            <input type="date" formControlName="from" class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3" />
          </label>
          <label class="flex flex-1 flex-col gap-1 text-sm">
            Hasta
            <input type="date" formControlName="to" class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3" />
          </label>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="useMyLocation()"
            class="min-h-[44px] rounded-md bg-[var(--color-primary-strong)] px-3 text-sm text-[var(--color-on-primary)]"
          >
            📍 Buscar cerca de mí
          </button>
          @if (locationCoords()) {
            <span class="text-xs text-[var(--color-text)]">Radio: {{ DEFAULT_RADIUS_METERS / 1000 }} km</span>
            <button type="button" (click)="clearMyLocation()" class="text-xs text-[var(--color-alert-strong)]">
              Quitar
            </button>
          }
        </div>

        <button
          type="submit"
          class="min-h-[44px] rounded-md bg-[var(--color-primary)] px-4 text-[var(--color-on-primary)]"
        >
          Buscar
        </button>
      </form>

      @if (loading() && items().length === 0) {
        <p class="text-center text-sm text-[var(--color-text)]">Cargando…</p>
      } @else if (items().length === 0) {
        <p class="text-center text-sm text-[var(--color-text)]">No se encontraron reportes con esos filtros.</p>
      }

      <div class="flex flex-col gap-3">
        @for (report of items(); track report.id) {
          <app-report-card [report]="report" />
        }
      </div>

      @if (nextCursor()) {
        <button
          type="button"
          [disabled]="loading()"
          (click)="loadMore()"
          class="min-h-[44px] rounded-md bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] disabled:opacity-60"
        >
          {{ loading() ? 'Cargando…' : 'Cargar más' }}
        </button>
      }
    </div>
  `,
})
export class ReportListPage {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(LostPetReportService);
  protected readonly session = inject(SessionStore);
  protected readonly DEFAULT_RADIUS_METERS = DEFAULT_RADIUS_METERS;

  protected readonly items = signal<LostPetReportResponse[]>([]);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly locationCoords = signal<{ latitude: number; longitude: number } | null>(null);

  protected readonly filtersForm = this.fb.nonNullable.group({
    species: [''],
    status: [''],
    location: [EMPTY_LOCATION],
    from: [''],
    to: [''],
  });

  constructor() {
    this.fetchPage();
  }

  protected useMyLocation(): void {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      this.locationCoords.set({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    });
  }

  protected clearMyLocation(): void {
    this.locationCoords.set(null);
  }

  protected applyFilters(): void {
    this.items.set([]);
    this.nextCursor.set(null);
    this.fetchPage();
  }

  protected loadMore(): void {
    this.fetchPage(this.nextCursor() ?? undefined);
  }

  private fetchPage(cursor?: string): void {
    this.loading.set(true);
    const { species, status, location, from, to } = this.filtersForm.getRawValue();
    const coords = this.locationCoords();

    const filters: ReportSearchRequest = {
      species: (species || undefined) as SpeciesDto | undefined,
      status: (status || undefined) as ReportStatusDto | undefined,
      departmentId: location.departmentId ?? undefined,
      cityId: location.cityId ?? undefined,
      neighborhoodId: location.neighborhoodId ?? undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      radiusMeters: coords ? DEFAULT_RADIUS_METERS : undefined,
      cursor,
      limit: 20,
    };

    this.reportService.search(filters).subscribe({
      next: (page) => {
        this.loading.set(false);
        this.items.update((list) => [...list, ...page.items]);
        this.nextCursor.set(page.nextCursor);
      },
      error: () => this.loading.set(false),
    });
  }
}
