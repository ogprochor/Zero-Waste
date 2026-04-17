import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ListItemComponent } from '../../shared/list-item/list-item';
import { OfferService } from '../../services/offer.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, RouterLink, ListItemComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  items: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private offerService: OfferService) {}
  
  ngOnInit(): void {
      this.offerService.getOffers({ page_size: 20 }).subscribe({
        next: (response) => {
          this.items = response.items.map(offer => 
            this.offerService.toListItem(offer)
          );
          this.loading = false;
        },
        error: (err) => {
          console.error('Błąd pobierania ofert:', err);
          this.error = 'Nie udało się pobrać ofert.';
          this.loading = false;
        }
      });
  }
}