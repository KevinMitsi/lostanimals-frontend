import { Injectable } from '@angular/core';
import './google-identity.types';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** Inyecta el script oficial de Google Identity Services una sola vez, sin importar cuántos botones lo usen. */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityLoaderService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (window.google) {
      return Promise.resolve();
    }

    if (!this.loadPromise) {
      this.loadPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'));
        document.head.appendChild(script);
      });
    }

    return this.loadPromise;
  }
}
