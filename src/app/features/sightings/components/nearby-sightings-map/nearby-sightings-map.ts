import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeoCoordinates, GeolocationService } from '../../../../core/location/geolocation.service';
import { SightingResponse } from '../../../../core/models';
import { SightingMap } from '../../../../shared/components/sighting-map/sighting-map';
import { SightingService } from '../../sighting.service';

const NEARBY_RADIUS_METERS = 5_000;
const REFRESH_DISTANCE_METERS = 500;

@Component({
  selector: 'app-nearby-sightings-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SightingMap],
  template: `
    <section class="flex flex-col gap-3" aria-labelledby="nearby-sightings-title">
      <div>
        <h2 id="nearby-sightings-title" class="text-xl font-bold text-[var(--color-primary-strong)]">
          Avistamientos cerca de ti
        </h2>
        <p class="text-sm text-[var(--color-text)] opacity-75">
          Mostramos un radio de 5 km y actualizamos el mapa si cambias de zona.
        </p>
      </div>

      @if (location.position(); as position) {
        <app-sighting-map [center]="position" [sightings]="sightings()" />
        @if (loading()) {
          <p class="text-xs text-[var(--color-text)]">Actualizando avistamientos cercanos…</p>
        }
      } @else {
        <div class="card-soft flex flex-col items-start gap-3">
          <p class="text-sm text-[var(--color-text)]">
            {{ location.errorMessage() ?? 'Autoriza tu ubicación para enfocar el mapa en tu zona actual.' }}
          </p>
          <button type="button" class="btn btn-primary" [disabled]="location.state() === 'requesting'" (click)="requestLocation()">
            {{ location.state() === 'requesting' ? 'Solicitando permiso…' : 'Permitir mi ubicación' }}
          </button>
        </div>
      }
    </section>
  `,
})
export class NearbySightingsMap {
  protected readonly location = inject(GeolocationService);
  private readonly sightingsService = inject(SightingService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sightings = signal<readonly SightingResponse[]>([]);
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
    this.sightingsService
      .search({ status: 'ACTIVE', latitude: position.latitude, longitude: position.longitude,
        radiusMeters: NEARBY_RADIUS_METERS, limit: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          this.sightings.set(items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}

export function distanceMeters(from: GeoCoordinates, to: GeoCoordinates): number {
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
