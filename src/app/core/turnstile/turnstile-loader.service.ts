import { Injectable } from '@angular/core';
import './turnstile.types';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Inyecta el script oficial de Cloudflare Turnstile una sola vez, sin importar cuántos widgets lo usen. */
@Injectable({ providedIn: 'root' })
export class TurnstileLoaderService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (window.turnstile) {
      return Promise.resolve();
    }

    if (!this.loadPromise) {
      this.loadPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar Cloudflare Turnstile.'));
        document.head.appendChild(script);
      });
    }

    return this.loadPromise;
  }
}
