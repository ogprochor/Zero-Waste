import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: CurrentUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = 'http://127.0.0.1:8000';
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;

  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(
    this.readUserFromStorage()
  );

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private readUserFromStorage(): CurrentUser | null {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? (JSON.parse(raw) as CurrentUser) : null;
    } catch {
      return null;
    }
  }

  register(data: {
    username: string;
    email: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, data);
  }

  login(data: {
    email: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login-json`, data);
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  setCurrentUser(user: CurrentUser | null): void {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }

    this.currentUserSubject.next(user);
  }

  setSession(token: string, user: CurrentUser): void {
    localStorage.setItem('jwt_token', token);
    this.setCurrentUser(user);
    this.scheduleAutoLogout(token);
  }

  clearSession(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  logout(): void {
    this.clearSession();
    window.location.href = '/login';
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  initAuth(): void {
    const token = this.getToken();

    if (!token) {
      this.clearSession();
      return;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return;
    }

    this.scheduleAutoLogout(token);
  }

  private decodeToken(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(normalized);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token ?? this.getToken();

    if (!tokenToCheck) return true;

    const decoded = this.decodeToken(tokenToCheck);
    const exp = decoded?.exp;

    if (!exp) return true;

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return exp <= nowInSeconds;
  }

  scheduleAutoLogout(token: string): void {
    const decoded = this.decodeToken(token);
    const exp = decoded?.exp;

    if (!exp) {
      this.logout();
      return;
    }

    const expiresAtMs = exp * 1000;
    const timeLeft = expiresAtMs - Date.now();

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    if (timeLeft <= 0) {
      this.logout();
      return;
    }

    this.logoutTimer = setTimeout(() => {
      this.logout();
    }, timeLeft);
  }
}