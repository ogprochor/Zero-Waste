import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../services/auth.service';
import { catchError, finalize, throwError } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    RouterModule,
    MatSnackBarModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(30),
            Validators.pattern(/^[a-zA-Z0-9_.-]+$/)
          ]
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
          ]
        ],
        confirmPassword: ['', Validators.required],
        rules: [false, Validators.requiredTrue]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }

  get passwordMismatch(): boolean {
    const hasError = this.registerForm.hasError('passwordMismatch');
    const confirmTouched = this.confirmPasswordControl?.touched;
    const confirmDirty = this.confirmPasswordControl?.dirty;
    const confirmValue = this.confirmPasswordControl?.value;

    return !!(hasError && confirmValue && (confirmTouched || confirmDirty));
  }

  onSubmit(): void {
    Object.keys(this.registerForm.controls).forEach((key) => {
      this.registerForm.get(key)?.markAsTouched();
    });

    if (this.registerForm.invalid) {
      this.snackBar.open(
        'Formularz zawiera błędy. Popraw je przed wysłaniem.',
        'OK',
        { duration: 3000 }
      );
      return;
    }

    this.isSubmitting = true;

    const payload = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    this.authService
      .register(payload)
      .pipe(
        catchError((err) => {
          console.error('Błąd rejestracji:', err);

          const detail = err?.error?.detail;

          if (Array.isArray(detail)) {
            detail.forEach((d: any) => {
              this.snackBar.open(
                d?.msg || 'Błąd walidacji',
                'Zamknij',
                { duration: 5000 }
              );
            });
          } else if (typeof detail === 'string') {
            this.snackBar.open(detail, 'Zamknij', { duration: 4000 });
          } else if (err.status === 0) {
            this.snackBar.open(
              'Brak połączenia z backendem albo błąd CORS.',
              'Zamknij',
              { duration: 5000 }
            );
          } else if (err.status === 500) {
            this.snackBar.open(
              'Backend zwrócił błąd 500. Sprawdź logi Dockera.',
              'Zamknij',
              { duration: 5000 }
            );
          } else {
            this.snackBar.open('Błąd rejestracji', 'Zamknij', {
              duration: 4000
            });
          }

          return throwError(() => err);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe(() => {
        this.snackBar.open('Konto zostało utworzone pomyślnie.', 'OK', {
          duration: 3000
        });
        this.router.navigate(['/login']);
      });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(
      control?.hasError(errorName) &&
      (control.touched || control.dirty)
    );
  }
}