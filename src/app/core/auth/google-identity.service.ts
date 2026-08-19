import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly document = inject(DOCUMENT);
  private loader: Promise<GoogleAccountsId> | null = null;

  load(): Promise<GoogleAccountsId> {
    if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
    if (this.loader) return this.loader;

    this.loader = new Promise((resolve, reject) => {
      const existing = this.document.querySelector<HTMLScriptElement>('script[data-google-identity]');
      const script = existing ?? this.document.createElement('script');
      script.addEventListener('load', () => {
        const api = window.google?.accounts.id;
        api ? resolve(api) : reject(new Error('Google Identity Services did not initialize'));
      }, { once: true });
      script.addEventListener('error', () => reject(new Error('Google Identity Services could not be loaded')), {
        once: true,
      });
      if (!existing) {
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.dataset['googleIdentity'] = 'true';
        this.document.head.appendChild(script);
      }
    });
    return this.loader;
  }
}
