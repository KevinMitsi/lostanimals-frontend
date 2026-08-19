import { Injectable, computed, signal } from '@angular/core';
import { JwtClaims, TokenResponse, UserRoleDto } from '../models';
import { decodeJwtClaims } from './jwt.util';

const STORAGE_KEY = 'lostanimals.session';

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  profileComplete: boolean;
}

/**
 * Estado de sesión en Signals, persistido en localStorage.
 * El rol/userId se derivan del JWT decodificado (solo para UI/routing;
 * la autorización real la hace el backend).
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly session = signal<StoredSession | null>(this.readFromStorage());

  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly refreshToken = computed(() => this.session()?.refreshToken ?? null);
  readonly profileComplete = computed(() => this.session()?.profileComplete ?? true);

  readonly claims = computed<JwtClaims | null>(() => {
    const token = this.accessToken();
    return token ? decodeJwtClaims(token) : null;
  });

  readonly userId = computed(() => this.claims()?.sub ?? null);
  readonly email = computed(() => this.claims()?.email ?? null);
  readonly role = computed<UserRoleDto | null>(() => this.claims()?.scope ?? null);

  readonly isAuthenticated = computed(() => {
    const claims = this.claims();
    return !!claims && claims.exp * 1000 > Date.now();
  });

  readonly isModeratorOrAdmin = computed(() => {
    const role = this.role();
    return role === 'MODERATOR' || role === 'ADMIN';
  });

  readonly isAdmin = computed(() => this.role() === 'ADMIN');

  setSession(tokens: Pick<TokenResponse, 'accessToken' | 'refreshToken'>, profileComplete = true): void {
    const next: StoredSession = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      profileComplete,
    };
    this.session.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  markProfileComplete(): void {
    const current = this.session();
    if (!current) return;
    const next = { ...current, profileComplete: true };
    this.session.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  clearSession(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private readFromStorage(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const stored = JSON.parse(raw) as Partial<StoredSession>;
      if (!stored.accessToken || !stored.refreshToken) return null;
      return {
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        profileComplete: stored.profileComplete ?? true,
      };
    } catch {
      return null;
    }
  }
}
