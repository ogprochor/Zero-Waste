import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ListItemComponent } from '../../shared/list-item/list-item';
import { OfferService } from '../../services/offer.service'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ListItemComponent],
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
      next: (data) => {
        
        console.log('Dane z backendu:', data);

        this.items = (data ?? []).map(offer => ({
          ...offer, 
          name: offer.title,          
          imageUrl: offer.image_url,  
          description: ''          
        })).slice(0, 20);

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Nie udało się pobrać ofert.';
        this.loading = false;
      },
    });
  }
}