//src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API_URL = 'http://127.0.0.1:8000'; // FastAPI

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

  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  setCurrentUser(user: CurrentUser | null): void {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(user);
  }

  logout(): void {
    this.setCurrentUser(null);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/login`, data);
  }
}
