import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = () => {

  const router = inject(Router);

  const adminUser = localStorage.getItem('adminUser');

  if (adminUser) {
    return true;
  }

  return router.createUrlTree(['/login']);

};