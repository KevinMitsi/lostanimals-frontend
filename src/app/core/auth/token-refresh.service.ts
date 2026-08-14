import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OpaqueTokenRequest, TokenResponse } from '../models';
import { SessionStore } from './session.store';

/**
 * Coordina un único refresh en vuelo: si llegan varios 401 concurrentes,
 * todos comparten la misma petición a /auth/refresh en vez de disparar una por cada uno.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  private refreshInFlight$: Observable<TokenResponse> | null = null;

  refresh(): Observable<TokenResponse> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token disponible.'));
    }

    const body: OpaqueTokenRequest = { token: refreshToken };

    this.refreshInFlight$ = this.http.post<TokenResponse>(`${environment.apiUrl}/auth/refresh`, body).pipe(
      tap((tokens) => this.session.setSession(tokens)),
      shareReplay(1),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
    );

    return this.refreshInFlight$;
  }
}
