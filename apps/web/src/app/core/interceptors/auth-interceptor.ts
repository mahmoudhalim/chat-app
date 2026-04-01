import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { AuthAPI } from '../../features/auth/services/auth-api';
import { Router } from '@angular/router';

type RefreshResult =
  | { status: 'success'; token: string }
  | { status: 'failed' };

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<RefreshResult | null>(null);

const shouldSkipRefreshHandling = (url: string): boolean => {
  return url.includes('/api/auth/login') || url.includes('/api/auth/refresh');
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('accessToken');
  const authAPI = inject(AuthAPI);
  const router = inject(Router);

  let authReq = req;
  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !shouldSkipRefreshHandling(authReq.url)) {
        return handle401Error(authReq, next, authAPI, router);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(request: HttpRequest<unknown>, next: HttpHandlerFn, authAPI: AuthAPI, router: Router): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authAPI.refresh().pipe(
      switchMap((success) => {
        isRefreshing = false;
        if (success) {
          const newToken = localStorage.getItem('accessToken');
          refreshTokenSubject.next({ status: 'success', token: newToken as string });
          return next(request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        }
        refreshTokenSubject.next({ status: 'failed' });
        refreshTokenSubject.next(null);
        authAPI.currentUser.set(null);
        localStorage.removeItem('accessToken');
        router.navigate(['/login']);
        return throwError(() => new Error('Refresh failed'));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshTokenSubject.next({ status: 'failed' });
        authAPI.currentUser.set(null);
        localStorage.removeItem('accessToken');
        router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter((result): result is RefreshResult => result !== null),
      take(1),
      switchMap((result) => {
        if (result.status === 'failed') {
          return throwError(() => new Error('Refresh failed'));
        }

        return next(request.clone({ setHeaders: { Authorization: `Bearer ${result.token}` } }));
      })
    );
  }
}
