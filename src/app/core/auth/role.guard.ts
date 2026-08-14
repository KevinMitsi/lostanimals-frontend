import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRoleDto } from '../models';
import { SessionStore } from './session.store';

/** Requiere sesión activa y uno de los roles indicados (MODERATOR/ADMIN según la ruta). */
export function roleGuard(allowedRoles: UserRoleDto[]): CanActivateFn {
  return (_route, state) => {
    const session = inject(SessionStore);
    const router = inject(Router);

    if (!session.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    const role = session.role();
    if (role && allowedRoles.includes(role)) {
      return true;
    }

    return router.createUrlTree(['/']);
  };
}
