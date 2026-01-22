import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

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
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {

  loginForm;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      alert('Uzupełnij poprawnie formularz!');
      return;
    }

    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(payload)
      .pipe(
        catchError(err => {
          console.error('Błąd logowania', err);
          alert(err.error?.detail || 'Nieprawidłowy email lub hasło');
          return throwError(() => err);
        })
      )
      .subscribe(res => {
        console.log('Logowanie udane', res);
        this.authService.setCurrentUser(res);
        alert('Zalogowano pomyślnie!');
        this.router.navigate(['/lista']);
      });
  }
}
