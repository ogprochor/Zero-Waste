import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const isLoginRequest = req.url.includes('/auth/login-json');
  const isRegisterRequest = req.url.includes('/auth/register');

  const requestToSend =
    token && !authService.isTokenExpired(token)
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : req;

  return next(requestToSend).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !isLoginRequest &&
        !isRegisterRequest
      ) {
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};