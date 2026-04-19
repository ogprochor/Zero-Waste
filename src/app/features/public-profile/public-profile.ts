import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { OfferService } from '../../services/offer.service';
import { CategoryService } from '../../services/category.service';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-profile.html',
  styleUrls: ['./public-profile.scss']
})
export class PublicProfileComponent implements OnInit {
  user: any;
  loading = true;
  activeTab: 'posty' | 'moje-ogloszenia' | 'obserwujacy' | 'obserwowani' = 'posty';

  offersLoading = false;
  private categoryMap = new Map<number, string>();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private offerService: OfferService,
    private categoryService: CategoryService,
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loadUser(id);
    this.loadOffers(id);
    this.loadPosts(id);
  }

  loadUser(id: number): void {
    this.authService.getUserById(id).subscribe({
      next: (u) => {
        this.user = {
          id: u.id,
          name: u.username,
          username: u.username,
          email: u.email,
          bio: u.bio || '',
          phone: u.phone || '',
          location: '',
          avatar: u.avatar_url ? `http://127.0.0.1:8000${u.avatar_url}` : '',
          joinedDate: '—',
          posts: [],
          followers: [],
          following: [],
          offers: [],
          postsCount: 0,
          offersCount: 0
        };
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadOffers(userId: number): void {
    this.offersLoading = true;

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categoryMap = new Map(categories.map(c => [c.id, c.name]));

        this.offerService.getOffers({ owner_id: userId, page_size: 50 }).subscribe({
          next: (response) => {
            this.user.offers = response.items.map(o => ({
              id: o.id,
              title: o.title,
              description: o.description,
              image_url: o.image_url,
              location: o.location,
              price: o.price,
              category: this.categoryMap.get(o.category_id) ?? 'Brak'
            }));
            this.user.offersCount = this.user.offers.length;
            this.offersLoading = false;
          },
          error: (err) => {
            console.error(err);
            this.offersLoading = false;
          }
        });
      }
    });
  }

  loadPosts(userId: number): void {
    this.postService.getUserPosts(userId).subscribe({
      next: (posts: any[]) => {
        this.user.posts = posts;
        this.user.postsCount = posts.length;
      },
      error: (err: any) => console.error(err)
    });
  }

  switchTab(tab: any): void {
    this.activeTab = tab;
  }

  goToOfferDetails(id: number): void {
    this.router.navigate(['/offers', id]);
  }
}