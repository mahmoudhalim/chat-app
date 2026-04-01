import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthAPI } from 'src/app/features/auth/services/auth-api';

export const guestGuard: CanActivateFn = (route, state) => {
  const authAPI = inject(AuthAPI);
  const router = inject(Router);

  if (authAPI.isAuthenticated() || authAPI.currentUser()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
