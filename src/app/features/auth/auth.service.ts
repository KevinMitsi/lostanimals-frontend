import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompleteGoogleProfileRequest,
  EmailActionRequest,
  GoogleAuthenticationRequest,
  GoogleAuthenticationResponse,
  LoginRequest,
  OpaqueTokenRequest,
  RegisterUserRequest,
  RegisteredUserResponse,
  ResetPasswordRequest,
  TokenResponse,
  GoogleAuthenticationRequest,
  GoogleAuthenticationResponse,
  CompleteGoogleProfileRequest,
  UserProfileResponse,
} from '../../core/models';
import { SessionStore } from '../../core/auth/session.store';

/** Mapea 1:1 los endpoints de `/api/v1/auth` (sección 3.1 del contrato). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  private readonly base = `${environment.apiUrl}/auth`;

  register(request: RegisterUserRequest): Observable<RegisteredUserResponse> {
    return this.http.post<RegisteredUserResponse>(`${this.base}/register`, request);
  }

  login(request: LoginRequest): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.base}/login`, request)
      .pipe(tap((tokens) => this.session.setSession(tokens)));
  }

  authenticateWithGoogle(request: GoogleAuthenticationRequest): Observable<GoogleAuthenticationResponse> {
    return this.http.post<GoogleAuthenticationResponse>(`${this.base}/google`, request).pipe(
      tap((response) => this.session.setSession(response, response.profileComplete)),
    );
  }

  completeGoogleProfile(request: CompleteGoogleProfileRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${environment.apiUrl}/users/me/profile`, request).pipe(
      tap(() => this.session.markProfileComplete()),
    );
  }

  verifyEmail(token: string): Observable<void> {
    const body: OpaqueTokenRequest = { token };
    return this.http.post<void>(`${this.base}/verify-email`, body);
  }

  resendVerification(request: EmailActionRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/resend-verification`, request);
  }

  forgotPassword(request: EmailActionRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/reset-password`, request);
  }

  /** Limpia la sesión local de inmediato y revoca el refresh token en el backend en segundo plano. */
  logout(): Observable<void> {
    const refreshToken = this.session.refreshToken();
    this.session.clearSession();

    if (!refreshToken) {
      return of(void 0);
    }

    const body: OpaqueTokenRequest = { token: refreshToken };
    return this.http.post<void>(`${this.base}/logout`, body).pipe(catchError(() => of(void 0)));
  }
}
