import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { User } from '@shared/models';

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthAPI {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/auth';
  private readonly usersUrl = '/api/users';

  currentUser = signal<User | null>(null);

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          this.currentUser.set(response.user);
          localStorage.setItem('accessToken', response.accessToken);
        })
      );
  }

  register(userData: any): Observable<User> {
    return this.http.post<User>(`${this.usersUrl}`, userData);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
        localStorage.removeItem('accessToken');
      })
    );
  }

  refresh(): Observable<boolean> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {}).pipe(
      map(response => {
        this.currentUser.set(response.user);
        localStorage.setItem('accessToken', response.accessToken);
        return true;
      }),
      catchError(() => {
        this.currentUser.set(null);
        localStorage.removeItem('accessToken');
        return of(false);
      })
    );
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('accessToken') !== null;
  }
}
