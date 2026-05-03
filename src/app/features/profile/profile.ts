import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; 
import { AuthService, CurrentUser } from '../../services/auth.service';
import { OfferService } from '../../services/offer.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service'; 
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { HttpClient } from '@angular/common/http';

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
    private router: Router,
    private postService: PostService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadCategoriesAndOffers();
    this.loadPosts();
    this.loadFollowers();
    this.loadFollowing();
  }

  // ================= USER =================
  loadUserProfile(): void {
    this.authService.fetchCurrentUser().subscribe({
      next: (u: CurrentUser) => {
        this.user = {
          id: u.id,
          name: u.username,
          username: u.username,
          email: u.email,
          bio: u.bio || '',
          phone: u.phone || '',
          location: '',
          avatar: u.avatar_url ? `${this.authService['API_URL']}${u.avatar_url}` : '',
          joinedDate: this.formatDate(new Date()),
          posts: [],
          followers: [],
          following: [],
          offers: [],
          postsCount: 0,
          offersCount: 0
        };

        this.initForm();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // ================= FORM =================
  initForm(): void {
    this.profileForm = this.fb.group({
      name: [this.user.name, Validators.required],
      username: [this.user.username, Validators.required],
      email: [this.user.email, [Validators.required, Validators.email]],
      bio: [this.user.bio],
      phone: [this.user.phone],
      location: [this.user.location]
    });

    this.avatarPreview = this.user.avatar || null;
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
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

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const data = {
      username: this.profileForm.value.username,
      email: this.profileForm.value.email,
      bio: this.profileForm.value.bio,
      phone: this.profileForm.value.phone
    };

    this.authService.updateUser(userId, data).subscribe({
      next: () => {
        this.notificationService.success('Zapisano profil');
        this.editMode = false;
      },
      error: () => this.notificationService.error('Błąd zapisu')
    });
  }

  // ================= POSTS =================
  loadPosts(): void {
    this.postService.getMyPosts().subscribe({
      next: (posts: any[]) => {
        this.user.posts = posts;
        this.user.postsCount = posts.length;
      }
    });
  }

  addPost(): void {
    this.addingPost = true;
  }

  submitPost(): void {
    if (!this.newPostContent.trim()) return;

    this.postService.createPost({
      content: this.newPostContent
    }).subscribe({
      next: (post) => {
        this.user.posts.unshift(post);
        this.user.postsCount++;
        this.newPostContent = '';
        this.addingPost = false;
      }
    });
  }

  cancelAddPost(): void {
    this.addingPost = false;
    this.newPostContent = '';
  }

  // ================= OFFERS =================
  loadCategoriesAndOffers(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categoryMap = new Map(categories.map(c => [c.id, c.name]));

        this.offerService.getOffers({ owner_id: userId }).subscribe({
          next: (res) => {
            this.user.offers = res.items;
            this.user.offersCount = res.items.length;
          }
        });
      }
    });
  }

  deleteOffer(event: Event, id: number): void {
    event.stopPropagation();

    this.offerService.deleteOffer(id).subscribe(() => {
      this.user.offers = this.user.offers.filter(o => o.id !== id);
      this.user.offersCount--;
    });
  }

  // ================= FOLLOW =================
  loadFollowers(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.http.get<any[]>(`${this.authService['API_URL']}/users/${userId}/followers`)
      .subscribe(data => this.user.followers = data);
  }

  loadFollowing(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.http.get<any[]>(`${this.authService['API_URL']}/users/${userId}/following`)
      .subscribe(data => this.user.following = data);
  }

  // ================= UI =================
  switchTab(tab: any): void {
    this.activeTab = tab;
  }

  goToOfferDetails(id: number): void {
    this.router.navigate(['/offers', id]);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString();
  }

  goToChangePassword(): void {
    this.router.navigate(['/profil/edytuj']);
  }
}