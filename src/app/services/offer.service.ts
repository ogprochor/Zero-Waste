import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ListItem } from '../models/list-item';

export interface Offer {
  id: number;
  title: string;
  description?: string | null;
  image_url?: string | null;
  location?: string | null;
  category_id: number;
  price?: number | null;
  owner_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OfferCreate {
  title: string;
  description?: string | null;
  location?: string | null;
  category_id: number;
  price?: number | null;
  image_url?: string | null;
}

export interface OfferUpdate extends OfferCreate {}

export interface PaginatedOffers {
  items: Offer[];
  page: number;
  page_size: number;
  total: number;
}

export interface UploadImageResponse {
  detail: string;
  image_url: string;
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

  // Główna metoda pobierania ofert z paginacją i filtrami
  getOffers(params?: {
    page?: number;
    page_size?: number;
    category_id?: number;
    location?: string;
    owner_id?: number;
    title?: string;
  }): Observable<PaginatedOffers> {
    const queryParams: any = { ...params };
    
    return this.http.get<PaginatedOffers>(this.offersUrl, { params: queryParams }).pipe(
      map(response => ({
        ...response,
        items: response.items.map(offer => ({
          ...offer,
          image_url: this.resolveImageUrl(offer.image_url)
        }))
      }))
    );
  }

  // Metoda dla "Moje oferty" - deleguje do getOffers z owner_id
  getUserOffers(userId: number): Observable<Offer[]> {
    return this.getOffers({ owner_id: userId, page_size: 100 }).pipe(
      map(response => response.items)
    );
  }

  // Dla kompatybilności wstecznej - alias do getUserOffers
  getOffersByOwner(ownerId: number): Observable<Offer[]> {
    return this.getUserOffers(ownerId);
  }

  getOfferById(id: number): Observable<Offer> {
    return this.http.get<Offer>(`${this.offersUrl}${id}`).pipe(
      map(offer => ({
        ...offer,
        image_url: this.resolveImageUrl(offer.image_url)
      }))
    );
  }

  createOffer(payload: OfferCreate): Observable<Offer> {
    return this.http.post<Offer>(this.offersUrl, payload).pipe(
      map(offer => ({
        ...offer,
        image_url: this.resolveImageUrl(offer.image_url)
      }))
    );
  }

  updateOffer(id: number, payload: OfferUpdate): Observable<Offer> {
    return this.http.put<Offer>(`${this.offersUrl}${id}`, payload).pipe(
      map(offer => ({
        ...offer,
        image_url: this.resolveImageUrl(offer.image_url)
      }))
    );
  }

  deleteOffer(id: number): Observable<any> {
    return this.http.delete(`${this.offersUrl}${id}`);
  }

  uploadOfferImage(offerId: number, file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadImageResponse>(
      `${this.offersUrl}${offerId}/image`,
      formData
    ).pipe(
      map(response => ({
        ...response,
        image_url: this.resolveImageUrl(response.image_url) || ''
      }))
    );
  }

  // Helper do konwersji na ListItem dla widoku listy
  toListItem(offer: Offer): ListItem {
    return {
      id: offer.id,
      name: offer.title,
      description: offer.description || '',
      imageUrl: offer.image_url || undefined,
      categoryId: offer.category_id,
      location: offer.location || ''
    };
  }
}