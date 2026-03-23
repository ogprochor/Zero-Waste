// app/features/profile/profile.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; 
import { AuthService, CurrentUser } from '../../services/auth.service';
import { OfferService } from '../../services/offer.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service'; 
import { FormsModule } from '@angular/forms';

export interface ProfileUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  joinedDate: string;
  posts: any[];
  followers: any[];
  following: any[];
  offers: any[];
  postsCount: number;
  offersCount: number;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, FormsModule]
})
export class ProfileComponent implements OnInit {
  user!: ProfileUser;
  editMode = false;
  profileForm!: FormGroup;
  avatarPreview: string | ArrayBuffer | null = null;
  selectedAvatarFile: File | null = null;
  activeTab: 'posty' | 'moje-ogloszenia' | 'obserwujacy' | 'obserwowani' = 'posty';
  loading = true;
  saving = false;
  addingPost = false;
  newPostContent = '';
  
  offersLoading = false;
  private categoryMap = new Map<number, string>();

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private offerService: OfferService,
    private categoryService: CategoryService, 
    private notificationService: NotificationService, 
    private router: Router 
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadCategoriesAndOffers();
  }

  loadUserProfile(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      this.user = {
        id: currentUser.id,
        name: currentUser.username,
        username: currentUser.username,
        email: currentUser.email,
        bio: currentUser.bio || '',
        phone: currentUser.phone || '',
        location: '',
        avatar: currentUser.avatar_url ? `${this.authService['API_URL']}${currentUser.avatar_url}` : '',
        joinedDate: this.formatDate(new Date()),
        posts: [],
        followers: [],
        following: [],
        offers: [],
        postsCount: 0,
        offersCount: 0
      };
      this.initForm();
    }
    this.loading = false;
  }

  loadCategoriesAndOffers(): void {
    this.offersLoading = true;
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.offersLoading = false;
      return;
    }

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categoryMap = new Map(categories.map(c => [c.id, c.name]));
        
        this.offerService.getOffers({ owner_id: userId, page_size: 50 }).subscribe({
          next: (response) => {
            if (this.user) {
              this.user.offers = response.items.map(offer => ({
                id: offer.id,
                title: offer.title,
                description: offer.description,
                image_url: offer.image_url,
                location: offer.location,
                price: offer.price,
                category: this.categoryMap.get(offer.category_id) ?? 'Brak kategorii'
              }));
              this.user.offersCount = this.user.offers.length;
            }
            this.offersLoading = false;
          },
          error: (err) => {
            console.error('Błąd ładowania ofert:', err);
            this.offersLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Błąd ładowania kategorii:', err);
        this.offersLoading = false;
      }
    });
  }

  formatDate(date: Date): string {
    const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 
                    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      name: [this.user.name, [Validators.required]],
      username: [this.user.username, [Validators.required]],
      email: [this.user.email, [Validators.required, Validators.email]],
      bio: [this.user.bio],
      phone: [this.user.phone, [Validators.pattern(/^\+?\d{9,15}$/)]],
      location: [this.user.location]
    });
    this.avatarPreview = this.user.avatar ? this.user.avatar : null;
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.profileForm.patchValue({
        name: this.user.name,
        username: this.user.username,
        email: this.user.email,
        bio: this.user.bio,
        phone: this.user.phone,
        location: this.user.location
      });
      this.avatarPreview = this.user.avatar ? this.user.avatar : null;
      this.selectedAvatarFile = null;
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    
    this.saving = true;
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.saving = false;
      return;
    }

    // Aktualizujemy dane tekstowe
    const updateData = {
      username: this.profileForm.value.username,
      email: this.profileForm.value.email,
      bio: this.profileForm.value.bio || '',
      phone: this.profileForm.value.phone || ''
    };

    this.authService.updateUser(userId, updateData).subscribe({
      next: () => {
        // Po aktualizacji danych, jeśli jest avatar to go uploaduj
        if (this.selectedAvatarFile) {
          this.authService.uploadAvatar(userId, this.selectedAvatarFile).subscribe({
            next: () => {
              // Pobierz świeże dane użytkownika po wszystkich zmianach
              this.refreshUserData();
            },
            error: (err) => {
              console.error('Błąd uploadu avatara:', err);
              this.refreshUserData(); // I tak odśwież dane
              this.notificationService.warning('Profil zaktualizowany, ale avatar nie został zapisany.');
            }
          });
        } else {
          // Pobierz świeże dane użytkownika
          this.refreshUserData();
        }
      },
      error: (err) => {
        console.error('Błąd zapisu profilu:', err);
        this.notificationService.error('Nie udało się zaktualizować profilu.');
        this.saving = false;
      }
    });
  }

  // NOWA METODA: pobiera świeże dane użytkownika z backendu
  private refreshUserData(): void {
    this.authService.fetchCurrentUser().subscribe({
      next: (freshUser) => {
        this.updateLocalUserWithFreshData(freshUser);
        this.notificationService.success('Profil zaktualizowany pomyślnie!');
      },
      error: (err) => {
        console.error('Błąd odświeżania danych:', err);
        this.notificationService.warning('Profil zaktualizowany, ale nie udało się odświeżyć danych.');
        this.saving = false;
      }
    });
  }

  // NOWA METODA: aktualizuje lokalne dane na podstawie świeżych z backendu
  private updateLocalUserWithFreshData(freshUser: CurrentUser): void {
    // Aktualizuj dane w localStorage
    this.authService.setCurrentUser(freshUser);
    
    const newAvatarUrl = freshUser.avatar_url ? `${this.authService['API_URL']}${freshUser.avatar_url}` : '';
    
    this.user = {
      ...this.user,
      name: this.profileForm.value.name,
      username: freshUser.username,
      email: freshUser.email,
      bio: freshUser.bio || '',
      phone: freshUser.phone || '',
      location: this.profileForm.value.location || '',
      avatar: newAvatarUrl
    };
    
    console.log('Zaktualizowany user:', this.user);
    
    this.editMode = false;
    this.saving = false;
    this.selectedAvatarFile = null;
    this.avatarPreview = newAvatarUrl ? newAvatarUrl : null;
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = e => this.avatarPreview = e.target?.result ?? null;
      reader.readAsDataURL(file);
    }
  }

  switchTab(tab: 'posty' | 'moje-ogloszenia' | 'obserwujacy' | 'obserwowani'): void {
    this.activeTab = tab;
  }

  addPost(): void {
    this.addingPost = true;
  }

  submitPost(): void {
    if (this.newPostContent.trim()) {
      const newPost = {
        id: Date.now(),
        content: this.newPostContent,
        date: new Date(),
        likes: 0,
        comments: 0
      };
      this.user.posts.unshift(newPost);
      this.user.postsCount = this.user.posts.length;
      this.newPostContent = '';
      this.addingPost = false;
      this.notificationService.success('Post został dodany!');
    }
  }

  cancelAddPost(): void {
    this.addingPost = false;
    this.newPostContent = '';
  }

  goToOfferDetails(id: number): void {
    this.router.navigate(['/offers', id]);
  }

  deleteOffer(event: Event, id: number): void {
    event.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) {
      this.offerService.deleteOffer(id).subscribe({
        next: () => {
          this.user.offers = this.user.offers.filter(offer => offer.id !== id);
          this.user.offersCount = this.user.offers.length;
          this.notificationService.success('Ogłoszenie zostało usunięte.');
        },
        error: (err) => {
          console.error('Błąd usuwania:', err);
          this.notificationService.error('Nie udało się usunąć ogłoszenia.');
        }
      });
    }
  }
  goToChangePassword(): void {
    this.router.navigate(['/profil/edytuj']);
  }
}