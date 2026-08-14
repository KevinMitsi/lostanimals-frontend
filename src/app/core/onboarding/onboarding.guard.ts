import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OnboardingStore } from './onboarding.store';

/** Manda al tutorial inicial la primera vez que alguien abre la app en este dispositivo. */
export const onboardingGuard: CanActivateFn = () => {
  const onboarding = inject(OnboardingStore);
  const router = inject(Router);

  if (onboarding.seen()) {
    return true;
  }

  return router.createUrlTree(['/onboarding']);
};
