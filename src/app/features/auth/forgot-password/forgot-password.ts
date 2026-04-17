import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordComponent {
  isSubmitting = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.notificationService.warning('Podaj poprawny adres email.');
      return;
    }

    this.isSubmitting = true;

    this.authService.forgotPassword(this.form.value.email || '')
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (res: { message: string }) => {
          this.notificationService.success(res.message);
        },
        error: () => {
          this.notificationService.error('Nie udało się wygenerować linku resetującego.');
        }
      });
  }
}