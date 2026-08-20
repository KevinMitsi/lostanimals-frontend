import { InjectionToken } from '@angular/core';

export interface RuntimeConfig {
  readonly mapboxPublicToken: string;
}

declare global {
  interface Window {
    __LOST_ANIMALS_CONFIG__?: Partial<RuntimeConfig>;
  }
}

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    mapboxPublicToken: window.__LOST_ANIMALS_CONFIG__?.mapboxPublicToken?.trim() ?? '',
  }),
});
