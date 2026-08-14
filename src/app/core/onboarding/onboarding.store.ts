import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'lostanimals.onboarding-seen';

/** Recuerda, por dispositivo, si el usuario ya vio el tutorial inicial. */
@Injectable({ providedIn: 'root' })
export class OnboardingStore {
  readonly seen = signal(localStorage.getItem(STORAGE_KEY) === '1');

  markSeen(): void {
    localStorage.setItem(STORAGE_KEY, '1');
    this.seen.set(true);
  }
}
