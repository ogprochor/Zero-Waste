import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, CurrentUser } from '../../services/auth.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.scss'
})
export class PublicProfileComponent implements OnInit {
  user: CurrentUser | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.error = 'Nieprawidłowy profil.';
      this.loading = false;
      return;
    }

    this.authService.getUserById(id).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nie udało się załadować profilu.';
        this.loading = false;
      }
    });
  }

  get avatarUrl(): string {
    if (!this.user?.avatar_url) {
      return '';
    }
    return `http://127.0.0.1:8000${this.user.avatar_url}`;
  }
}