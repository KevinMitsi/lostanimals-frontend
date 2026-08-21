import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeoCoordinates, GeolocationService } from '../../../../core/location/geolocation.service';
import { LostPetReportResponse } from '../../../../core/models';
import { SightingMap } from '../../../../shared/components/sighting-map/sighting-map';
import { LostPetReportService } from '../../lost-pet-report.service';

const CITY_RADIUS_METERS = 50_000;
const REFRESH_DISTANCE_METERS = 500;

@Component({
  selector: 'app-nearby-lost-pets-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SightingMap],
  template: `
    <section class="flex flex-col gap-3" aria-labelledby="nearby-lost-pets-title">
      <div>
        <h2 id="nearby-lost-pets-title" class="text-xl font-bold text-[var(--color-primary-strong)]">
          Animales perdidos cerca de ti
        </h2>
        <p class="text-sm text-[var(--color-text)] opacity-75">
          Explora reportes activos en la ciudad y abre cada marcador para ver su información.
        </p>
      </div>

      @if (location.position(); as position) {
        <app-sighting-map
          [center]="position"
          [lostPetReports]="reports()"
          ariaLabel="Mapa de animales perdidos cercanos"
        />
        @if (loading()) {
          <p class="text-xs text-[var(--color-text)]">Actualizando animales perdidos cercanos…</p>
        }
      } @else {
        <div class="card-soft flex flex-col items-start gap-3">
          <p class="text-sm text-[var(--color-text)]">
            {{ location.errorMessage() ?? 'Autoriza tu ubicación para mostrar animales perdidos en tu zona.' }}
          </p>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="location.state() === 'requesting'"
            (click)="requestLocation()"
          >
            {{ location.state() === 'requesting' ? 'Solicitando permiso…' : 'Permitir mi ubicación' }}
          </button>
        </div>
      }
    </section>
  `,
})
export class NearbyLostPetsMap {
  protected readonly location = inject(GeolocationService);
  private readonly reportService = inject(LostPetReportService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly reports = signal<readonly LostPetReportResponse[]>([]);
  protected readonly loading = signal(false);
  private lastSearchCenter: GeoCoordinates | null = null;

  constructor() {
    this.location.startWatching();
    effect(() => {
      const position = this.location.position();
      if (!position) return;
      if (this.lastSearchCenter && distanceMeters(this.lastSearchCenter, position) < REFRESH_DISTANCE_METERS) return;
      this.loadNearby(position);
    });
    this.destroyRef.onDestroy(() => this.location.stopWatching());
  }

  protected requestLocation(): void {
    this.location.startWatching();
  }

  private loadNearby(position: GeoCoordinates): void {
    this.lastSearchCenter = position;
    this.loading.set(true);
    this.reportService
      .search({
        status: 'LOST',
        latitude: position.latitude,
        longitude: position.longitude,
        radiusMeters: CITY_RADIUS_METERS,
        limit: 50,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          this.reports.set(items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}

function distanceMeters(from: GeoCoordinates, to: GeoCoordinates): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
