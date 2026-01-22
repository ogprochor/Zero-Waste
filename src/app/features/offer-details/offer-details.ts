import { Component, OnInit } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ItemService, OfferDto } from '../../services/item.service';
import { AuthService } from '../../services/auth.service';

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

          <p *ngIf="offer.price != null" class="description">
            <strong>Cena:</strong> {{ offer.price }}
          </p>

          <div class="actions">
            <button routerLink="/" class="btn-secondary">
              <span class="icon">←</span> Powrót do strony głównej
            </button>

            <a *ngIf="isOwner" [routerLink]="['/offers', offer.id, 'edit']" class="btn-secondary" style="margin-left: 8px;">
              ✏️ Edytuj
            </a>

            <button *ngIf="isOwner" (click)="openDeleteModal()" class="btn-secondary" style="margin-left: 8px; border-color:#e74c3c;">
              🗑️ Usuń
            </button>
          </div>

          <p *ngIf="flashMsg" style="margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: rgba(46, 204, 113, 0.12); border: 1px solid rgba(46, 204, 113, 0.25);">
            {{ flashMsg }}
          </p>

          <p *ngIf="error" style="margin-top: 12px; color:#e74c3c;">{{ error }}</p>
        </div>
      </div>

      <!-- MODAL POTWIERDZENIA USUNIĘCIA -->
      <div class="zw-modal-backdrop" *ngIf="showDeleteModal">
        <div class="zw-modal">
          <h3>Usunąć ofertę?</h3>
          <p>Tej operacji nie da się cofnąć.</p>
          <div class="zw-modal-actions">
            <button class="btn-secondary" (click)="closeDeleteModal()" [disabled]="deleting">Anuluj</button>
            <button class="btn-secondary" (click)="confirmDelete()" [disabled]="deleting" style="border-color:#e74c3c;">
              {{ deleting ? 'Usuwanie...' : 'Usuń' }}
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
  offer: OfferDto | null = null;

  deleting = false;
  showDeleteModal = false;
  error: string | null = null;
  flashMsg: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private itemService: ItemService,
    private authService: AuthService,
    private router: Router
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((p) => {
      this.flashMsg = p['msg'] ?? null;
    });
    if (this.id) {
      this.itemService.getOfferById(Number(this.id)).subscribe({
        next: (data) => this.offer = data,
        error: (err) => console.error('Błąd pobierania oferty:', err)
      });
    }
  }

  get isOwner(): boolean {
    const me = this.authService.getCurrentUserId();
    return !!this.offer && !!me && this.offer.owner_id === me;
  }

  openDeleteModal(): void {
    this.error = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.deleting) return;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.offer) return;
    this.deleting = true;
    this.error = null;

    this.itemService.deleteOffer(this.offer.id).subscribe({
      next: () => {
        this.router.navigate(['/lista'], {
          queryParams: { msg: 'Oferta została usunięta.' },
        });
      },
      error: (err) => {
        console.error(err);
        this.error = err?.error?.detail || 'Nie udało się usunąć oferty.';
        this.deleting = false;
      },
    });
  }
}