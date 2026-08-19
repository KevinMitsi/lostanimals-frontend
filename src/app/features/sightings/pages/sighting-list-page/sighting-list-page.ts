import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { SightingResponse, SightingSearchRequest, SightingStatusDto, SpeciesDto } from '../../../../core/models';
import {
  GeographyCascadeSelector,
  GeographyLocationValue,
} from '../../../../shared/components/geography-cascade-selector/geography-cascade-selector';
import { SightingCard } from '../../components/sighting-card/sighting-card';
import { SightingService } from '../../sighting.service';

const EMPTY_LOCATION: GeographyLocationValue = { departmentId: null, cityId: null, neighborhoodId: null };
const DEFAULT_RADIUS_METERS = 5000;

@Component({
  selector: 'app-sighting-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, SightingCard, GeographyCascadeSelector],
  template: `
    <div class="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <div class="flex items-center justify-between gap-2">
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Avistamientos</h1>
        <div class="flex items-center gap-3">
          @if (session.isAuthenticated()) {
            <a routerLink="/sightings/mine" class="btn-link">Mis avistamientos</a>
          }
          <a routerLink="/sightings/new" class="btn btn-primary">+ Reportar</a>
        </div>
      </div>

      <button type="button" (click)="filtersOpen.set(!filtersOpen())" class="btn btn-ghost self-start">
        🔍 {{ filtersOpen() ? 'Ocultar filtros' : 'Filtrar' }}
        @if (!filtersOpen() && activeFilterCount() > 0) {
          <span class="badge bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]">
            {{ activeFilterCount() }}
          </span>
        }
      </button>

      @if (filtersOpen()) {
        <form [formGroup]="filtersForm" (ngSubmit)="applyFilters()" class="card-soft flex flex-col gap-3">
          <div class="flex flex-col gap-3 sm:flex-row">
            <label class="field-label flex-1">
              Especie
              <select formControlName="species" class="field-input">
                <option value="">Todas</option>
                <option value="DOG">Perro</option>
                <option value="CAT">Gato</option>
                <option value="BIRD">Ave</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>

            <label class="field-label flex-1">
              Estado
              <select formControlName="status" class="field-input">
                <option value="">Todos</option>
                <option value="ACTIVE">Activo</option>
                <option value="CLOSED">Cerrado</option>
              </select>
            </label>
          </div>

          <app-geography-cascade-selector formControlName="location" />

          <div class="flex flex-col gap-3 sm:flex-row">
            <label class="field-label flex-1">
              Desde
              <input type="date" formControlName="from" class="field-input" />
            </label>
            <label class="field-label flex-1">
              Hasta
              <input type="date" formControlName="to" class="field-input" />
            </label>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" (click)="useMyLocation()" class="btn btn-primary">📍 Buscar cerca de mí</button>
            @if (locationCoords()) {
              <span class="text-xs text-[var(--color-text)]">Radio: {{ DEFAULT_RADIUS_METERS / 1000 }} km</span>
              <button type="button" (click)="clearMyLocation()" class="text-xs text-[var(--color-alert-strong)]">
                Quitar
              </button>
            }
          </div>

          <button type="submit" class="btn btn-accent">Buscar</button>
        </form>
      }

      @if (loading() && items().length === 0) {
        <p class="text-center text-sm text-[var(--color-text)]">Cargando…</p>
      } @else if (items().length === 0) {
        <p class="text-center text-sm text-[var(--color-text)]">No se encontraron avistamientos con esos filtros.</p>
      }

      <div class="flex flex-col gap-3">
        @for (sighting of items(); track sighting.id) {
          <app-sighting-card [sighting]="sighting" />
        }
      </div>

      @if (nextCursor()) {
        <button type="button" [disabled]="loading()" (click)="loadMore()" class="btn btn-ghost">
          {{ loading() ? 'Cargando…' : 'Cargar más' }}
        </button>
      }
    </div>
  `,
})
export class SightingListPage {
  private readonly fb = inject(FormBuilder);
  private readonly sightingService = inject(SightingService);
  protected readonly session = inject(SessionStore);
  protected readonly DEFAULT_RADIUS_METERS = DEFAULT_RADIUS_METERS;

  protected readonly items = signal<SightingResponse[]>([]);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly locationCoords = signal<{ latitude: number; longitude: number } | null>(null);
  protected readonly filtersOpen = signal(false);

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
      this.locationCoords.set({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    });
  }

  protected clearMyLocation(): void {
    this.locationCoords.set(null);
  }

  protected applyFilters(): void {
    this.items.set([]);
    this.nextCursor.set(null);
    this.filtersOpen.set(false);
    this.fetchPage();
  }

  protected activeFilterCount(): number {
    const { species, status, location, from, to } = this.filtersForm.getRawValue();
    return [species, status, location.neighborhoodId, from, to, this.locationCoords()].filter(Boolean).length;
  }

  protected loadMore(): void {
    this.fetchPage(this.nextCursor() ?? undefined);
  }

  private fetchPage(cursor?: string): void {
    this.loading.set(true);
    const { species, status, location, from, to } = this.filtersForm.getRawValue();
    const coords = this.locationCoords();

    const filters: SightingSearchRequest = {
      species: (species || undefined) as SpeciesDto | undefined,
      status: (status || undefined) as SightingStatusDto | undefined,
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

    this.sightingService.search(filters).subscribe({
      next: (page) => {
        this.loading.set(false);
        this.items.update((list) => [...list, ...page.items]);
        this.nextCursor.set(page.nextCursor);
      },
      error: () => this.loading.set(false),
    });
  }
}
