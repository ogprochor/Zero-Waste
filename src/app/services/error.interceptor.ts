// app/services/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Wystąpił nieoczekiwany błąd.';

      if (error.status === 0) {
        errorMessage = 'Brak połączenia z serwerem. Sprawdź połączenie internetowe.';
      } else if (error.status === 400) {
        if (error.error?.detail) {
          if (Array.isArray(error.error.detail)) {
            errorMessage = error.error.detail.map((e: any) => e.msg).join(', ');
          } else {
            errorMessage = error.error.detail;
          }
        } else {
          errorMessage = 'Nieprawidłowe dane żądania.';
        }
      } else if (error.status === 401) {
        errorMessage = 'Sesja wygasła. Zaloguj się ponownie.';
        if (!router.url.includes('/login')) {
          router.navigate(['/login']);
        }
      } else if (error.status === 403) {
        errorMessage = 'Nie masz uprawnień do wykonania tej operacji.';
      } else if (error.status === 404) {
        errorMessage = 'Nie znaleziono żądanego zasobu.';
      } else if (error.status === 422) {
        if (error.error?.detail) {
          if (Array.isArray(error.error.detail)) {
            errorMessage = error.error.detail.map((e: any) => {
              return `${e.loc?.join('.')}: ${e.msg}`;
            }).join(', ');
          } else {
            errorMessage = error.error.detail;
          }
        } else {
          errorMessage = 'Walidacja danych nie powiodła się.';
        }
      } else if (error.status === 500) {
        errorMessage = 'Wewnętrzny błąd serwera. Spróbuj ponownie później.';
      }

      notificationService.error(errorMessage);
      return throwError(() => error);
    })
  );
};