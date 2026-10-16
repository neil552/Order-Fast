import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const staffAccessGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;

  const router = inject(Router);
  const isStaffRoute = ['admin', 'cocina'].includes(segments[0]?.path ?? '');
  const returnUrl = isStaffRoute
    ? `/${segments.map((segment) => segment.path).join('/')}`
    : '/admin';
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};
