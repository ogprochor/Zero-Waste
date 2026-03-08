import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Offer {
  id: number;
  title?: string;
  name?: string;
  description?: string | null;
  image_url?: string | null;
  location?: string | null;
  category_id?: number;
  owner_id?: number | null;
  price?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private API_URL = 'http://127.0.0.1:8000';
  private offersUrl = `${this.API_URL}/offers/`;

  constructor(private http: HttpClient) {}

  private resolveImageUrl(url?: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.API_URL}${url}`;
  }

  private normalizeOffer(offer: any): Offer {
    return {
      ...offer,
      image_url: this.resolveImageUrl(offer.image_url ?? offer.imageUrl ?? null),
    };
  }

  getOffers(ownerId?: number): Observable<Offer[]> {
    let url = `${this.offersUrl}?page=1&page_size=100`;
    if (ownerId) {
      url += `&owner_id=${ownerId}`;
    }

    return this.http.get<any>(url).pipe(
      map((response) => {
        const offers = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
          ? response.items
          : [];

        return offers
          .sort((a: any, b: any) => Number(b.id) - Number(a.id))
          .map((offer: any) => this.normalizeOffer(offer));
      })
    );
  }

  getUserOffers(userId: number): Observable<Offer[]> {
    return this.getOffers(userId);
  }

  getOfferById(id: number): Observable<Offer> {
    return this.http.get<Offer>(`${this.offersUrl}${id}`).pipe(
      map((offer) => this.normalizeOffer(offer))
    );
  }

  deleteOffer(id: number): Observable<any> {
    return this.http.delete(`${this.offersUrl}${id}`);
  }
}