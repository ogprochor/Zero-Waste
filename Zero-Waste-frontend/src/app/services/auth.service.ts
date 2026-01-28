//src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API_URL = 'http://127.0.0.1:8000';
  private TOKEN_KEY = 'jwt_token';

  constructor(private http: HttpClient) {}

  register(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, data).pipe(
      tap(res => {
        // kontrakt JWT
        if (res?.access_token) {
          localStorage.setItem(this.TOKEN_KEY, res.access_token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

