import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  return authService.getCurrentUser().pipe(map(user => {
      if (user.role === 'admin') {
        return true;
      }

      return router.createUrlTree(['/']);
    }),
    catchError (() => {
      return of(router.createUrlTree(['/login']));
    })
  );
};