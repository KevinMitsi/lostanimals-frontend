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
import { LostPetReportResponse, SightingResponse } from '../../../core/models';

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
      @if (selectable() && !configurationError()) {
        <p class="pointer-events-none absolute left-3 top-3 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold shadow">
          Desplaza el mapa para ubicar el pin en el punto exacto
        </p>
        <svg
          width="36"
          height="48"
          viewBox="0 0 24 32"
          fill="var(--color-primary-strong)"
          class="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full drop-shadow-lg"
          aria-hidden="true"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" />
          <circle cx="12" cy="12" r="5" fill="white" />
        </svg>
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
  readonly lostPetReports = input<readonly LostPetReportResponse[]>([]);
  readonly selectable = input(false);
  readonly selectedPoint = input<GeoCoordinates | null>(null);
  readonly ariaLabel = input('Mapa de avistamientos cercanos');
  readonly pointSelected = output<GeoCoordinates>();

  protected readonly configurationError = signal<string | null>(null);

  private map: MapboxMap | null = null;
  private readonly sightingMarkers: Marker[] = [];
  private userMarker: Marker | null = null;
  private hasCenteredOnUser = false;
  private enlargedMarkerEl: HTMLElement | null = null;

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
      const lostPetReports = this.lostPetReports();
      if (this.map) this.renderAnimals(sightings, lostPetReports);
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
    const initialPoint = this.selectedPoint() ?? center;
    this.map = new MapboxMap({
      container: this.container().nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialPoint ? [initialPoint.longitude, initialPoint.latitude] : DEFAULT_CENTER,
      zoom: initialPoint ? 13 : 5,
      attributionControl: true,
      dragPan: true,
      touchZoomRotate: true,
    });
    if (center) {
      this.configureNavigationBounds(center);
      this.hasCenteredOnUser = true;
    }
    this.map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    this.map.on('moveend', () => {
      if (!this.selectable() || !this.map) return;
      const mapCenter = this.map.getCenter();
      this.pointSelected.emit({ latitude: mapCenter.lat, longitude: mapCenter.lng });
    });
    this.map.on('click', () => this.collapseEnlargedMarker());
    this.map.on('load', () => {
      if (center) this.renderUserMarker(center);
      this.renderAnimals(this.sightings(), this.lostPetReports());
      if (this.selectable() && this.map) {
        const mapCenter = this.map.getCenter();
        this.pointSelected.emit({ latitude: mapCenter.lat, longitude: mapCenter.lng });
      }
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

  private renderAnimals(
    sightings: readonly SightingResponse[],
    lostPetReports: readonly LostPetReportResponse[],
  ): void {
    this.sightingMarkers.splice(0).forEach((marker) => marker.remove());
    this.enlargedMarkerEl = null;

    const mapItems: MapAnimalItem[] = [
      ...lostPetReports.map((report) => ({
        id: report.id,
        latitude: report.latitude,
        longitude: report.longitude,
        title: report.petName,
        imageUrl: (report.images.find(({ primary }) => primary) ?? report.images[0])?.url,
        detailPath: ['/lost-pet-reports', report.id],
        markerColor: '#9c5a3c',
      })),
      ...sightings.map((sighting) => ({
        id: sighting.id,
        latitude: sighting.latitude,
        longitude: sighting.longitude,
        title: 'Animal avistado',
        imageUrl: (sighting.images.find(({ primary }) => primary) ?? sighting.images[0])?.url,
        detailPath: ['/sightings', sighting.id],
        markerColor: '#5f7360',
      })),
    ];

    mapItems.forEach((item) => {
      const root = document.createElement('div');
      root.className = 'animal-map-marker';
      root.style.setProperty('--marker-color', item.markerColor);
      root.setAttribute('role', 'button');
      root.setAttribute('aria-label', `Ver foto de ${item.title}`);

      let photo: HTMLElement;
      if (item.imageUrl) {
        const image = document.createElement('img');
        image.alt = `Foto de ${item.title}`;
        image.src = item.imageUrl;
        image.loading = 'lazy';
        photo = image;
      } else {
        const fallback = document.createElement('div');
        fallback.textContent = '🐾';
        fallback.className = 'animal-map-marker-photo--fallback';
        photo = fallback;
      }
      photo.classList.add('animal-map-marker-photo');
      root.append(photo);

      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.className = 'animal-map-marker-view-btn';
      viewButton.textContent = 'Ver publicación';
      root.append(viewButton);

      root.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleEnlargedMarker(root);
      });
      viewButton.addEventListener('click', (event) => {
        event.stopPropagation();
        void this.router.navigate(item.detailPath);
      });

      const marker = new mapboxgl.Marker({ element: root, anchor: 'center' })
        .setLngLat([item.longitude, item.latitude])
        .addTo(this.map!);
      this.sightingMarkers.push(marker);
    });
  }

  private toggleEnlargedMarker(root: HTMLElement): void {
    const wasEnlarged = root === this.enlargedMarkerEl;
    if (this.enlargedMarkerEl && this.enlargedMarkerEl !== root) {
      this.enlargedMarkerEl.classList.remove('is-enlarged');
    }
    root.classList.toggle('is-enlarged', !wasEnlarged);
    this.enlargedMarkerEl = wasEnlarged ? null : root;
  }

  private collapseEnlargedMarker(): void {
    if (!this.enlargedMarkerEl) return;
    this.enlargedMarkerEl.classList.remove('is-enlarged');
    this.enlargedMarkerEl = null;
  }

  private renderUserMarker(center: GeoCoordinates): void {
    this.userMarker?.remove();
    this.userMarker = new mapboxgl.Marker({ color: '#46606b', scale: 0.8 })
      .setLngLat([center.longitude, center.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 16 }).setText('Tu ubicación actual'))
      .addTo(this.map!);
  }
}

interface MapAnimalItem {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly title: string;
  readonly imageUrl?: string;
  readonly detailPath: string[];
  readonly markerColor: string;
}
