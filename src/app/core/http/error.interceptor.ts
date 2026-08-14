import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenRefreshService } from '../auth/token-refresh.service';
import { SessionStore } from '../auth/session.store';
import { NotificationService } from '../notifications/notification.service';
import { parseProblemDetail } from './problem-detail.util';

/**
 * Interceptor único de errores (sección 4 del contrato):
 * - Parsea el ProblemDetail (RFC 7807) del backend.
 * - En 401 de sesión (no de negocio en /auth/**) intenta refresh una vez y reintenta la petición.
 * - Muestra una notificación traducida para el resto de errores.
 * Las peticiones a /auth/** dejan el manejo de errores de negocio (401 credenciales, 403 email
 * no verificado, 409 duplicados, 422 Turnstile) a los propios formularios, que necesitan
 * reaccionar con UI específica en vez de un toast genérico.
 * Las peticiones que NO van a nuestra API (ej. el PUT presignado a S3 del ImageUploadService)
 * nunca disparan refresh de sesión ni reciben el header Authorization en el reintento —
 * un 401/403 ahí es de la firma presignada, no de nuestra sesión.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const tokenRefresh = inject(TokenRefreshService);
  const notifications = inject(NotificationService);
  const router = inject(Router);

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isAuthEndpoint = req.url.startsWith(`${environment.apiUrl}/auth/`);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const problem = parseProblemDetail(error);

      const isSessionExpired = isApiRequest && error.status === 401 && !isAuthEndpoint;

      if (isSessionExpired && session.refreshToken()) {
        return tokenRefresh.refresh().pipe(
          switchMap((tokens) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } })),
          ),
          catchError(() => {
            session.clearSession();
            notifications.error('Tu sesión expiró, inicia sesión de nuevo.');
            router.navigate(['/login']);
            return throwError(() => problem);
          }),
        );
      }

      if (isSessionExpired) {
        session.clearSession();
        notifications.error('Tu sesión expiró, inicia sesión de nuevo.');
        router.navigate(['/login']);
        return throwError(() => problem);
      }

      if (!isAuthEndpoint) {
        notifications.error(problem.detail);
      }

      return throwError(() => problem);
    }),
  );
};
