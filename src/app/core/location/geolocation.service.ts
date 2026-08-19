import { Injectable, signal } from '@angular/core';

export interface GeoCoordinates {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters?: number;
}

export type GeolocationState = 'idle' | 'requesting' | 'watching' | 'denied' | 'unavailable' | 'error';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  readonly position = signal<GeoCoordinates | null>(null);
  readonly state = signal<GeolocationState>('idle');
  readonly errorMessage = signal<string | null>(null);

  private watchId: number | null = null;

  startWatching(): void {
    if (this.watchId !== null) return;
    if (!navigator.geolocation) {
      this.state.set('unavailable');
      this.errorMessage.set('Tu navegador no permite obtener la ubicación.');
      return;
    }

    this.state.set('requesting');
    this.errorMessage.set(null);
    this.watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        this.position.set({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracy,
        });
        this.state.set('watching');
      },
      (error) => {
        this.watchId = null;
        this.state.set(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
        this.errorMessage.set(geolocationErrorMessage(error.code));
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 12_000 },
    );
  }

  stopWatching(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    this.watchId = null;
  }
}

export function geolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Necesitamos tu permiso de ubicación para mostrar avistamientos cercanos.';
    case 2:
      return 'No pudimos determinar tu ubicación. Revisa el GPS o la conexión.';
    case 3:
      return 'La ubicación tardó demasiado. Intenta nuevamente.';
    default:
      return 'No fue posible acceder a tu ubicación.';
  }
}
