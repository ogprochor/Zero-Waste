import { Component, OnInit } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { OfferService, Offer } from '../../services/offer.service';

@Component({
  selector: 'app-offer-details',
  standalone: true,
  imports: [NgIf, RouterLink, CommonModule],
  template: `
    <section class="offer-details" *ngIf="offer; else loading">
      <div class="offer-card">
        <div class="image-wrapper" *ngIf="getImageUrl(); else noImage">
          <img [src]="getImageUrl()!" [alt]="offer.title || 'Zdjęcie oferty'" />
        </div>

        <ng-template #noImage>
          <div class="image-wrapper image-wrapper--empty">
            <span>Brak zdjęcia</span>
          </div>
        </ng-template>

        <div class="content-wrapper">
          <div class="owner-actions" *ngIf="isOwner">
            <button class="btn-edit" (click)="onEdit()">
              <span class="icon">✏️</span> Edytuj ofertę
            </button>
            <button class="btn-delete" (click)="confirmDelete()">
              <span class="icon">🗑️</span> Usuń
            </button>
          </div>

          <span class="location-badge" *ngIf="offer.location">📍 {{ offer.location }}</span>
          <h2>{{ offer.title || offer.name }}</h2>
          <p class="description">{{ offer.description }}</p>

          <p *ngIf="offer.price != null" class="description">
            <strong>Cena:</strong> {{ offer.price === 0 ? 'Za darmo' : offer.price + ' zł' }}
          </p>

          <div class="actions">
            <button routerLink="/" class="btn-secondary">
              <span class="icon">←</span> Powrót do strony głównej
            </button>
          </div>

          <p *ngIf="flashMsg" class="flash-message">{{ flashMsg }}</p>
          <p *ngIf="error" class="error-message">{{ error }}</p>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showDeleteModal">
        <div class="modal-card">
          <h3>Potwierdź usunięcie</h3>
          <p>
            Czy na pewno chcesz trwale usunąć ofertę:
            <strong>{{ offer.title || offer.name }}</strong>?
          </p>
          <div class="modal-buttons">
            <button class="btn-cancel" (click)="showDeleteModal = false" [disabled]="deleting">
              Anuluj
            </button>
            <button class="btn-confirm-delete" (click)="deleteOffer()" [disabled]="deleting">
              {{ deleting ? 'Usuwanie...' : 'Tak, usuń' }}
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

  isOwner = false;
  showDeleteModal = false;
  deleting = false;
  error: string | null = null;
  flashMsg: string | null = null;

  private readonly API_URL = 'http://127.0.0.1:8000';

  constructor(
    private route: ActivatedRoute,
    private offerService: OfferService,
    private router: Router
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((p) => {
      this.flashMsg = p['msg'] ?? null;
    });

    if (this.id) {
      this.offerService.getOfferById(Number(this.id)).subscribe({
        next: (data: Offer) => {
          this.offer = data;
          this.checkOwnership();
        },
        error: (err: any) => {
          console.error('Błąd pobierania oferty:', err);
          this.error = 'Nie udało się pobrać szczegółów oferty.';
        }
      });
    }
  }

  getImageUrl(): string | null {
    const imageUrl = this.offer?.image_url ?? null;

    if (!imageUrl) {
      return null;
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    return `${this.API_URL}${imageUrl}`;
  }

  checkOwnership(): void {
    const storedUser = localStorage.getItem('currentUser');

    if (this.offer && storedUser) {
      const currentUser = JSON.parse(storedUser);
      this.isOwner = Number(this.offer.owner_id) === Number(currentUser.id);
    } else {
      this.isOwner = false;
    }
  }

  confirmDelete(): void {
    this.showDeleteModal = true;
  }

  onEdit(): void {
    this.router.navigate(['/offers', this.id, 'edit']);
  }

  deleteOffer(): void {
    if (this.id && this.offer) {
      this.deleting = true;

      this.offerService.deleteOffer(Number(this.id)).subscribe({
        next: () => {
          this.showDeleteModal = false;
          this.router.navigate(['/'], {
            queryParams: { msg: 'Oferta została usunięta.' }
          });
        },
        error: (err: any) => {
          console.error('Błąd podczas usuwania oferty:', err);
          this.error = 'Nie udało się usunąć oferty.';
          this.deleting = false;
          this.showDeleteModal = false;
        }
      });
    }
  }
}