import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { catchError, finalize, throwError } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false]
    });
  }

  onSubmit(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });

    if (this.loginForm.invalid) {
      this.snackBar.open('Popraw błędy w formularzu.', 'OK', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;

    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(payload)
      .pipe(
        catchError(err => {
          this.snackBar.open(
            err.error?.detail || 'Nieprawidłowy email lub hasło',
            'Zamknij',
            { duration: 7000 }
          );
          return throwError(() => err);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe(response => {
        this.authService.setSession(response.access_token, response.user);
        this.snackBar.open('Zalogowano pomyślnie.', 'OK', { duration: 2500 });
        this.router.navigate(['/']);
      });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control?.hasError(errorName) && (control.touched || control.dirty));
  }
}