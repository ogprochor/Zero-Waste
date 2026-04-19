import { Component } from '@angular/core';
import {
  Router,
  RouterOutlet,
  RouterLinkWithHref,
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, CurrentUser, UserSearchResult } from '../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLinkWithHref,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    NgIf,
    NgFor,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  sidenavOpened = false;
  currentUser$!: Observable<CurrentUser | null>;

  searchQuery = '';
  searchResults: UserSearchResult[] = [];
  searchOpen = false;
  searching = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  logout(): void {
    this.authService.logout();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery = value;

    if (value.trim().length < 2) {
      this.searchResults = [];
      this.searchOpen = false;
      return;
    }

    this.searching = true;

    this.authService.searchUsers(value).subscribe({
      next: (users) => {
        this.searchResults = users;
        this.searchOpen = true;
        this.searching = false;
      },
      error: () => {
        this.searchResults = [];
        this.searchOpen = false;
        this.searching = false;
      }
    });
  }

  openProfile(userId: number): void {
    this.searchOpen = false; // zamyka dropdown (opcjonalne)
    this.router.navigate(['/profil', userId]);
  }

  closeSearch(): void {
    setTimeout(() => {
      this.searchOpen = false;
    }, 150);
  }
}