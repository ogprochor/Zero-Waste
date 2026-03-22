import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, CurrentUser } from '../../services/auth.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!password && !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-edit.html',
  styleUrl: './profile-edit.scss'
})
export class ProfileEditComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  currentUser: CurrentUser | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(30),
            Validators.pattern(/^[a-zA-Z0-9_]+$/)
          ]
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*[\W_]).+$/)
          ]
        ],
        confirmPassword: [''],
        bio: [''],
        phone: ['']
      },
      { validators: passwordMatchValidator }
    );

    const localUser = this.authService.getCurrentUser();

    if (localUser) {
      this.currentUser = localUser;
      this.form.patchValue({
        username: localUser.username,
        email: localUser.email
      });
    } else {
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => {
          this.currentUser = user;
          this.authService.setCurrentUser(user);

          this.form.patchValue({
            username: user.username,
            email: user.email,
            bio: user.bio ?? '',
            phone: user.phone ?? ''
          });
        },
        error: () => {
          this.errorMessage = 'Nie udało się pobrać danych użytkownika.';
        }
      });
    }
  }

  get username() {
    return this.form.get('username');
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  get confirmPassword() {
    return this.form.get('confirmPassword');
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      this.errorMessage = 'Brak ID użytkownika.';
      return;
    }

    const formValue = this.form.value;

    const payload: any = {
      username: formValue.username,
      email: formValue.email,
      bio: formValue.bio,
      phone: formValue.phone
    };

    if (formValue.password && formValue.password.trim() !== '') {
      payload.password = formValue.password;
    }

    this.isSubmitting = true;

    this.authService.updateUser(userId, payload).subscribe({
      next: (updatedUser) => {
        this.isSubmitting = false;

        const mergedUser: CurrentUser = {
          id: this.currentUser?.id ?? userId,
          username: updatedUser.username,
          email: updatedUser.email
        };

        this.authService.setCurrentUser(mergedUser);
        this.successMessage = 'Dane profilu zostały zapisane.';

        setTimeout(() => {
          this.router.navigateByUrl('/');
        }, 1200);
      },
      error: (error) => {
        this.isSubmitting = false;

        if (error?.error?.detail) {
          this.errorMessage = error.error.detail;
        } else {
          this.errorMessage = 'Nie udało się zapisać zmian.';
        }
      }
    });
  }

  onCancel(): void {
    this.router.navigateByUrl('/');
  }
}