import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const staffAccessGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;

  const router = inject(Router);
  const returnUrl = `/${segments.map((segment) => segment.path).join('/')}`;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};
