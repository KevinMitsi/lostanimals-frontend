import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NavigationError, provideRouter, withNavigationErrorHandler } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';

const CHUNK_LOAD_FAILURE = /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i;

/**
 * Después de cada deploy, los hashes de los chunks cambian. Si alguien tiene una pestaña
 * abierta de una versión anterior y navega a una ruta lazy, el chunk viejo ya no existe en
 * el servidor y el fallback de SPA devuelve `index.html` en vez del `.js` — eso revienta el
 * import dinámico. En vez de dejar la pantalla rota, recargamos para traer la versión actual.
 */
function handleNavigationError(event: NavigationError): void {
  const message = event.error instanceof Error ? event.error.message : String(event.error);
  if (CHUNK_LOAD_FAILURE.test(message)) {
    window.location.reload();
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withNavigationErrorHandler(handleNavigationError)),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
