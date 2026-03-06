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
    this.offerService.getOffers().subscribe({
      next: (data: any[]) => {
        console.log('Dane z backendu:', data);

        this.items = data
          .map((offer: any) => ({
            ...offer,
            name: offer.title ?? offer.name ?? '',
            imageUrl: offer.image_url ?? null,
            description: offer.description ?? ''
          }))
          .slice(0, 20);

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Nie udało się pobrać ofert.';
        this.loading = false;
      },
    });
  }
}