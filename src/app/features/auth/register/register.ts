import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../services/auth.service'; // ścieżka do Twojego auth.service.ts
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

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
    RouterModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {

  registerForm;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    // tworzymy formularz i dodajemy custom validator
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      rules: [false, Validators.requiredTrue],
      newsletter: [false]
    }, { validators: this.passwordMatchValidator });
  }

  // custom validator dla zgodności haseł
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      alert('Uzupełnij poprawnie formularz!');
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
          console.error('Błąd rejestracji', err);
          alert(err.error?.detail || 'Błąd rejestracji');
          return throwError(() => err);
        })
      )
      .subscribe(res => {
        console.log('Rejestracja udana', res);
        alert('Konto utworzone pomyślnie!');
        this.registerForm.reset();
      });
  }
}
