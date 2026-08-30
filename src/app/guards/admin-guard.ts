import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('token');
  const adminUserJson = localStorage.getItem('adminUser');

  if (!token || !adminUserJson) {
    return router.createUrlTree(['/login']);
  }

  try {
    const user = JSON.parse(adminUserJson);

    if (user.role === 'admin') {
      return true;
    }
  } catch {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
  }

  return router.createUrlTree(['/login']);
};