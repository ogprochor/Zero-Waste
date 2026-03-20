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
import { NotificationService } from '../../../services/notification.service';

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
    private notificationService: NotificationService,
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
      this.notificationService.warning('Formularz zawiera błędy. Popraw je przed wysłaniem.');
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
          return throwError(() => err);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe(() => {
        this.notificationService.success('Konto zostało utworzone pomyślnie.');
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

  getFieldError(fieldName: string): string | null {
    const control = this.registerForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['required']) return 'To pole jest wymagane.';
    if (control.errors['minlength']) {
      return `Minimalna długość to ${control.errors['minlength'].requiredLength} znaków.`;
    }
    if (control.errors['maxlength']) {
      return `Maksymalna długość to ${control.errors['maxlength'].requiredLength} znaków.`;
    }
    if (control.errors['email']) return 'Nieprawidłowy format email.';
    if (control.errors['pattern']) {
      if (fieldName === 'username') {
        return 'Nazwa użytkownika może zawierać tylko litery, cyfry, _ . -';
      }
      if (fieldName === 'password') {
        return 'Hasło musi zawierać co najmniej jedną wielką literę i jeden znak specjalny';
      }
    }
    
    return null;
  }
}