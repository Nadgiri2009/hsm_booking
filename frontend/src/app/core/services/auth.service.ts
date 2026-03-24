import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  token?: string;
  access?: string;
  refresh?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AdminUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiService, private router: Router) {
    const saved = localStorage.getItem('hsm_admin') || sessionStorage.getItem('hsm_admin');
    if (saved) {
      this.currentUserSubject.next(JSON.parse(saved));
    }
  }

  login(email: string, password: string, remember: boolean): Observable<AdminUser> {
    return this.api.post<LoginResponse>('auth/login/', { email, password }).pipe(
      map((response) => ({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          token: response.access,
          access: response.access,
          refresh: response.refresh,
          user: response.user
      } as AdminUser)),
      tap((session) => {
        this.currentUserSubject.next(session);
        if (remember) {
          localStorage.setItem('hsm_admin', JSON.stringify(session));
          sessionStorage.removeItem('hsm_admin');
        } else {
          sessionStorage.setItem('hsm_admin', JSON.stringify(session));
          localStorage.removeItem('hsm_admin');
        }
      })
    );
  }

  logout(): void {
    const refresh = this.getRefreshToken();
    if (refresh) {
      this.api.post('auth/logout/', { refresh }).subscribe({
        next: () => this.clearSessionAndRedirect(),
        error: () => this.clearSessionAndRedirect()
      });
      return;
    }
    this.clearSessionAndRedirect();
  }

  private clearSessionAndRedirect(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('hsm_admin');
    sessionStorage.removeItem('hsm_admin');
    this.router.navigate(['/admin/login']);
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.currentUserSubject.value?.access || this.currentUserSubject.value?.token || null;
  }

  getRefreshToken(): string | null {
    return this.currentUserSubject.value?.refresh || null;
  }

  refreshToken(): Observable<{ access: string; refresh?: string }> {
    const refresh = this.getRefreshToken();
    return this.api.post<{ access: string; refresh?: string }>('auth/refresh/', { refresh }).pipe(
      tap((res) => {
        const current = this.currentUserSubject.value;
        if (!current) return;
        const updated: AdminUser = {
          ...current,
          token: res.access,
          access: res.access,
          refresh: res.refresh || current.refresh
        };
        this.currentUserSubject.next(updated);
        if (localStorage.getItem('hsm_admin')) {
          localStorage.setItem('hsm_admin', JSON.stringify(updated));
        } else {
          sessionStorage.setItem('hsm_admin', JSON.stringify(updated));
        }
      })
    );
  }
}
