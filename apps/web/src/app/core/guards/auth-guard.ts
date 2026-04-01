import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthAPI } from 'src/app/features/auth/services/auth-api';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authAPI = inject(AuthAPI);
  const router = inject(Router);

  if (authAPI.currentUser()) {
    return true;
  }

  if (authAPI.isAuthenticated()) {
    return authAPI.refresh().pipe(
      map(success => {
        if (success) {
          return true;
        } else {
          router.navigate(['/login']);
          return false;
        }
      }),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  }

  router.navigate(['/login']);
  return false;
};
