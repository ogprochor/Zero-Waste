// src/app/features/auth/register/register.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
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

  constructor(private fb: FormBuilder, private authService: AuthService, private snackBar: MatSnackBar) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_.-]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [
        Validators.pattern(/^(\d{9}|\d{3}\s\d{3}\s\d{3})$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
      ]],
      confirmPassword: ['', Validators.required],
      rules: [false, Validators.requiredTrue],
      newsletter: [false]
    }, { validators: this.passwordMatchValidator });

    // Walidacja live
    ['username','email','password','confirmPassword','phone'].forEach(key => {
      this.registerForm.get(key)?.valueChanges.subscribe(() => {
        this.registerForm.get(key)?.markAsTouched();
      });
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    if (!confirmPassword) return null;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }

  get passwordMismatch() {
    const hasError = this.registerForm.hasError('passwordMismatch');
    const confirmTouched = this.confirmPasswordControl?.touched;
    const confirmDirty = this.confirmPasswordControl?.dirty;
    const confirmValue = this.confirmPasswordControl?.value;
    return hasError && confirmValue && (confirmTouched || confirmDirty);
  }

  onSubmit() {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });

    if (this.registerForm.invalid) {
      this.snackBar.open('Formularz zawiera błędy. Popraw je przed wysłaniem.', 'OK', { duration: 3000 });
      return;
    }

    const payload = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      phone: this.registerForm.value.phone,
      newsletter: this.registerForm.value.newsletter
    };

    this.authService.register(payload)
      .pipe(
        catchError(err => {
          // Wyświetlenie błędów backendu z Pydantic
          const detail = err.error?.detail;
          if (detail && Array.isArray(detail)) {
            detail.forEach((d: any) => {
              this.snackBar.open(d.msg || d, 'Zamknij', { duration: 5000 });
            });
          } else {
            this.snackBar.open(err.error?.detail || 'Błąd rejestracji', 'Zamknij', { duration: 4000 });
          }
          return throwError(() => err);
        })
      )
      .subscribe(() => {
        this.snackBar.open('Konto zostało utworzone pomyślnie', 'OK', { duration: 4000 });
        this.registerForm.reset();
      });
  }

  hasError(controlName: string, errorName: string) {
    const control = this.registerForm.get(controlName);
    return control?.hasError(errorName) && (control.value || control.touched);
  }
}
