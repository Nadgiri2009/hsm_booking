import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  access: string;
  refresh: string;
  user: { id: number; email: string; name: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('hsm_access_token');
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login/`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem('hsm_access_token', res.access);
        localStorage.setItem('hsm_refresh_token', res.refresh);
        localStorage.setItem('hsm_user', JSON.stringify(res.user));
        this.isLoggedInSubject.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('hsm_access_token');
    localStorage.removeItem('hsm_refresh_token');
    localStorage.removeItem('hsm_user');
    this.isLoggedInSubject.next(false);
  }

  refreshToken(): Observable<{ access: string }> {
    const refresh = localStorage.getItem('hsm_refresh_token');
    return this.http.post<{ access: string }>(`${this.apiUrl}/auth/token/refresh/`, { refresh }).pipe(
      tap((res) => localStorage.setItem('hsm_access_token', res.access))
    );
  }

  getToken(): string | null {
    return localStorage.getItem('hsm_access_token');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('hsm_user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password/`, { email });
  }
}
