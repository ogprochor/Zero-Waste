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
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZąćęłńóśżźĄĆĘŁŃÓŚŻŹ\s'-]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^\d{9}$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', Validators.required],
      rules: [false, Validators.requiredTrue],
      newsletter: [false]
    }, { validators: this.passwordMatchValidator });

    // Walidacja w czasie rzeczywistym dla wszystkich pól
    this.registerForm.get('name')?.valueChanges.subscribe(() => {
      this.registerForm.get('name')?.markAsTouched();
    });

    this.registerForm.get('email')?.valueChanges.subscribe(() => {
      this.registerForm.get('email')?.markAsTouched();
    });

    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.registerForm.get('password')?.markAsTouched();
      this.registerForm.get('confirmPassword')?.updateValueAndValidity();
    });

    this.registerForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.registerForm.get('confirmPassword')?.markAsTouched();
    });

    // Blokowanie liter w numerze telefonu + walidacja na żywo
    this.registerForm.get('phone')?.valueChanges.subscribe(value => {
      this.registerForm.get('phone')?.markAsTouched();
      if (value) {
        const numbersOnly = value.replace(/\D/g, '').slice(0, 9);
        if (value !== numbersOnly) {
          this.registerForm.get('phone')?.setValue(numbersOnly, { emitEvent: false });
        }
      }
    });
  }

  // Validator sprawdzający zgodność haseł
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

  get passwordMismatch() {
    const hasError = this.registerForm.hasError('passwordMismatch');
    const confirmTouched = this.confirmPasswordControl?.touched;
    const confirmDirty = this.confirmPasswordControl?.dirty;
    const confirmValue = this.confirmPasswordControl?.value;
    
    return hasError && confirmValue && (confirmTouched || confirmDirty);
  }

  onSubmit() {
    // Oznacz wszystkie pola jako "touched" żeby pokazać błędy
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });

    if (this.registerForm.invalid) {
      this.snackBar.open('Formularz zawiera błędy. Popraw je przed wysłaniem.', 'OK', { duration: 3000 });
      return;
    }

    const payload = {
      username: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      phone: this.registerForm.value.phone,
      newsletter: this.registerForm.value.newsletter
    };

    this.authService.register(payload)
      .pipe(
        catchError(err => {
          this.snackBar.open(err.error?.detail || 'Błąd rejestracji', 'Zamknij', { duration: 4000 });
          return throwError(() => err);
        })
      )
      .subscribe(res => {
        this.snackBar.open('Konto zostało utworzone pomyślnie', 'OK', { duration: 4000 });
        this.registerForm.reset();
      });
  }

  hasError(controlName: string, errorName: string) {
    const control = this.registerForm.get(controlName);
    return control?.hasError(errorName) && (control.value || control.touched);
  }
}