import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import mapboxgl, { Map as MapboxMap, Marker } from 'mapbox-gl';
import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { GeoCoordinates } from '../../../core/location/geolocation.service';
import { SightingResponse } from '../../../core/models';

const DEFAULT_CENTER: [number, number] = [-74.0721, 4.711];
const CITY_NAVIGATION_RADIUS_KM = 35;

@Component({
  selector: 'app-sighting-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="relative overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-[0_2px_14px_rgba(47,54,59,0.12)]">
      <div #mapContainer class="h-[22rem] w-full" [attr.aria-label]="ariaLabel()"></div>
      @if (configurationError()) {
        <div class="absolute inset-0 grid place-items-center bg-[var(--color-surface)] p-6 text-center">
          <p class="max-w-md text-sm text-[var(--color-alert-strong)]">{{ configurationError() }}</p>
        </div>
      }
      @if (selectable()) {
        <p class="pointer-events-none absolute left-3 top-3 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold shadow">
          Haz clic en el punto exacto del avistamiento
        </p>
      }
      @if (center() && !configurationError()) {
        <button
          type="button"
          class="absolute bottom-8 left-3 z-10 min-h-11 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[var(--color-primary-strong)] shadow-md"
          aria-label="Volver a centrar el mapa en mi ubicación"
          (click)="recenterOnUser()"
        >
          📍 Mi ubicación
        </button>
      }
    </div>
  `,
})
export class SightingMap implements OnDestroy {
  private readonly runtimeConfig = inject(RUNTIME_CONFIG);
  private readonly router = inject(Router);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  readonly center = input<GeoCoordinates | null>(null);
  readonly sightings = input<readonly SightingResponse[]>([]);
  readonly selectable = input(false);
  readonly selectedPoint = input<GeoCoordinates | null>(null);
  readonly ariaLabel = input('Mapa de avistamientos cercanos');
  readonly pointSelected = output<GeoCoordinates>();

  protected readonly configurationError = signal<string | null>(null);

  private map: MapboxMap | null = null;
  private readonly sightingMarkers: Marker[] = [];
  private userMarker: Marker | null = null;
  private selectionMarker: Marker | null = null;
  private hasCenteredOnUser = false;

  constructor() {
    afterNextRender(() => this.initialize());
    effect(() => {
      const center = this.center();
      if (center && this.map) {
        this.renderUserMarker(center);
        if (!this.hasCenteredOnUser) {
          this.configureNavigationBounds(center);
          this.recenterOnUser();
          this.hasCenteredOnUser = true;
        }
      }
    });
    effect(() => {
      const sightings = this.sightings();
      if (this.map) this.renderSightings(sightings);
    });
    effect(() => {
      const point = this.selectedPoint();
      if (this.map) this.renderSelection(point);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  protected recenterOnUser(): void {
    const center = this.center();
    if (!center || !this.map) return;
    this.map.easeTo({ center: [center.longitude, center.latitude], zoom: 13, duration: 700 });
  }

  private initialize(): void {
    const token = this.runtimeConfig.mapboxPublicToken;
    if (!token.startsWith('pk.')) {
      this.configurationError.set('Falta configurar MAPBOX_PUBLIC_TOKEN con un token público restringido de Mapbox.');
      return;
    }

    mapboxgl.accessToken = token;
    const center = this.center();
    this.map = new MapboxMap({
      container: this.container().nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center ? [center.longitude, center.latitude] : DEFAULT_CENTER,
      zoom: center ? 13 : 5,
      attributionControl: true,
      dragPan: true,
      touchZoomRotate: true,
    });
    if (center) {
      this.configureNavigationBounds(center);
      this.hasCenteredOnUser = true;
    }
    this.map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    this.map.on('click', ({ lngLat }) => {
      if (!this.selectable()) return;
      this.pointSelected.emit({ latitude: lngLat.lat, longitude: lngLat.lng });
    });
    this.map.on('load', () => {
      if (center) this.renderUserMarker(center);
      this.renderSightings(this.sightings());
      this.renderSelection(this.selectedPoint());
    });
  }

  private configureNavigationBounds(center: GeoCoordinates): void {
    if (!this.map) return;

    const latitudeDelta = CITY_NAVIGATION_RADIUS_KM / 111.32;
    const longitudeDelta = CITY_NAVIGATION_RADIUS_KM /
      (111.32 * Math.max(Math.cos((center.latitude * Math.PI) / 180), 0.01));

    this.map.setMaxBounds([
      [center.longitude - longitudeDelta, center.latitude - latitudeDelta],
      [center.longitude + longitudeDelta, center.latitude + latitudeDelta],
    ]);
  }

  private renderSightings(sightings: readonly SightingResponse[]): void {
    this.sightingMarkers.splice(0).forEach((marker) => marker.remove());
    sightings.forEach((sighting) => {
      const popupContent = document.createElement('button');
      popupContent.type = 'button';
      popupContent.className = 'sighting-map-popup';
      popupContent.setAttribute('aria-label', `Ver detalle del avistamiento creado el ${sighting.createdAt}`);

      const image = document.createElement('img');
      image.alt = 'Foto del animal avistado';
      image.src = (sighting.images.find(({ primary }) => primary) ?? sighting.images[0])?.url ?? '';
      image.loading = 'lazy';
      popupContent.append(image);

      const date = document.createElement('span');
      date.textContent = `Publicado ${new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(sighting.createdAt))}`;
      popupContent.append(date);
      popupContent.addEventListener('click', () => void this.router.navigate(['/sightings', sighting.id]));

      const popup = new mapboxgl.Popup({ offset: 18, closeButton: true }).setDOMContent(popupContent);
      const marker = new mapboxgl.Marker({ color: '#9c5a3c' })
        .setLngLat([sighting.longitude, sighting.latitude])
        .setPopup(popup)
        .addTo(this.map!);
      this.sightingMarkers.push(marker);
    });
  }

  private renderUserMarker(center: GeoCoordinates): void {
    this.userMarker?.remove();
    this.userMarker = new mapboxgl.Marker({ color: '#46606b', scale: 0.8 })
      .setLngLat([center.longitude, center.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 16 }).setText('Tu ubicación actual'))
      .addTo(this.map!);
  }

  private renderSelection(point: GeoCoordinates | null): void {
    this.selectionMarker?.remove();
    this.selectionMarker = null;
    if (!point) return;
    this.selectionMarker = new mapboxgl.Marker({ color: '#5f7360', draggable: true })
      .setLngLat([point.longitude, point.latitude])
      .addTo(this.map!);
    this.selectionMarker.on('dragend', () => {
      const lngLat = this.selectionMarker!.getLngLat();
      this.pointSelected.emit({ latitude: lngLat.lat, longitude: lngLat.lng });
    });
  }
}
