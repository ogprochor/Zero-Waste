import { Component, OnInit } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OfferService, Offer } from '../../services/offer.service';

@Component({
  selector: 'app-offer-details',
  standalone: true,
  imports: [NgIf, RouterLink, CommonModule],
  template: `
    <section class="offer-details" *ngIf="offer; else loading">
      <div class="offer-card">
        <div class="image-wrapper">
          <img [src]="offer.image_url" [alt]="offer.title" *ngIf="offer.image_url">
        </div>

        <div class="content-wrapper">
          <span class="location-badge">📍 {{ offer.location }}</span>
          <h2>{{ offer.title }}</h2>
          <p class="description">{{ offer.description }}</p>
          
          <div class="actions">
            <button routerLink="/" class="btn-secondary">
              <span class="icon">←</span> Powrót do strony głównej
            </button>
          </div>
        </div>
      </div>
    </section>

    <ng-template #loading>
      <div class="loader-container">
        <div class="loader">Ładowanie szczegółów oferty...</div>
      </div>
    </ng-template>
  `,
  styleUrls: ['./offer-details.scss']
})
export class OfferDetailsComponent implements OnInit {
  id: string | null;
  offer: Offer | null = null;

  constructor(
    private route: ActivatedRoute,
    private offerService: OfferService
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    if (this.id) {
      this.offerService.getOfferById(Number(this.id)).subscribe({
        next: (data) => this.offer = data,
        error: (err) => console.error('Błąd pobierania oferty:', err)
      });
    }
  }
}