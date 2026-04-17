import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ListItemComponent } from '../../shared/list-item/list-item';
import { OfferService } from '../../services/offer.service';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-my-offers',
  standalone: true,
  templateUrl: './my-offers.html',
  styleUrls: ['./my-offers.scss'],
  imports: [NgFor, NgIf, RouterLink, ListItemComponent],
})
export class MyOffersComponent implements OnInit {
  items: any[] = [];
  loading = true;

  constructor(
    private router: Router,
    private offerService: OfferService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private notificationService: NotificationService 
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.router.navigate(['/auth/login']);
      return;
    }

    forkJoin({
      offers: this.offerService.getUserOffers(userId),
      categories: this.categoryService.getCategories(),
    }).subscribe({
      next: ({ offers, categories }) => {
        const categoryMap = new Map(categories.map((c: any) => [c.id, c.name]));
        const offersData = Array.isArray(offers) ? offers : (offers as any).items || [];
        
        this.items = offersData.map((o: any) => ({
          id: o.id,
          name: o.title ?? '',
          description: o.description ?? '',
          category: categoryMap.get(o.category_id) ?? 'Brak kategorii',
          city: String(o.location ?? '').trim(),
          imageUrl: o.image_url ?? null,
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  goToDetails(id: number): void {
    this.router.navigate(['/offers', id]);
  }

  deleteOffer(event: Event, id: number): void {
    event.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) {
      this.offerService.deleteOffer(id).subscribe({
        next: () => {
          this.items = this.items.filter(item => item.id !== id);
        },
        error: (err) => {
          console.error('Błąd usuwania:', err);
          alert('Nie udało się usunąć ogłoszenia.');
        }
      });
    }
  }
}