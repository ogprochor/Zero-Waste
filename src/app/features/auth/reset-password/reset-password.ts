import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordComponent {
  isSubmitting = false;
  token = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  submit(): void {
    this.form.markAllAsTouched();

    const password = this.form.value.password || '';
    const confirmPassword = this.form.value.confirmPassword || '';

    if (!this.token) {
      this.notificationService.error('Brak tokenu resetującego.');
      return;
    }

    if (this.form.invalid) {
      this.notificationService.warning('Hasło musi mieć minimum 8 znaków.');
      return;
    }

    if (password !== confirmPassword) {
      this.notificationService.warning('Hasła nie są takie same.');
      return;
    }

    this.isSubmitting = true;

    this.authService.resetPassword(this.token, password)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (res: { message: string }) => {
          this.notificationService.success(res.message);
          this.router.navigate(['/login']);
        },
        error: () => {
          this.notificationService.error('Nie udało się zmienić hasła.');
        }
      });
  }
}