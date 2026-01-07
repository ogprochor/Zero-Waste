import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-offer-details',
  standalone: true,
  imports: [NgIf, RouterLink], //  musi tu być RouterLink
  template: `
    <section class="offer-details">
      <h2>Placeholder: Offer Details</h2>

      <p *ngIf="id">
        Szczegóły oferty o ID: <strong>{{ id }}</strong>
      </p>

      <!--  PRZYCISK POWROTU DO HOME -->
      <button routerLink="/" class="back-btn">
        ← Powrót do strony głównej
      </button>
    </section>
  `,
  styleUrls: ['./offer-details.scss']
})
export class OfferDetailsComponent {
  id: string | null;

  constructor(private route: ActivatedRoute) {
    this.id = this.route.snapshot.paramMap.get('id');
  }
}
