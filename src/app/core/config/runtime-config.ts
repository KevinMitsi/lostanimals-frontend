import { InjectionToken } from '@angular/core';

export interface FirebaseWebConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
}

export interface RuntimeConfig {
  readonly mapboxPublicToken: string;
  readonly socrataAppToken: string;
  readonly firebaseConfig: FirebaseWebConfig;
  readonly firebaseVapidKey: string;
}

declare global {
  interface Window {
    __LOST_ANIMALS_CONFIG__?: Partial<RuntimeConfig>;
  }
}

const EMPTY_FIREBASE_CONFIG: FirebaseWebConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    mapboxPublicToken: window.__LOST_ANIMALS_CONFIG__?.mapboxPublicToken?.trim() ?? '',
    socrataAppToken: window.__LOST_ANIMALS_CONFIG__?.socrataAppToken?.trim() ?? '',
    firebaseConfig: window.__LOST_ANIMALS_CONFIG__?.firebaseConfig ?? EMPTY_FIREBASE_CONFIG,
    firebaseVapidKey: window.__LOST_ANIMALS_CONFIG__?.firebaseVapidKey?.trim() ?? '',
  }),
});
