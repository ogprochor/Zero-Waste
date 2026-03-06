import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ListItem } from '../models/list-item';

export interface OfferDto {
  id: number;
  title?: string;
  name?: string;
  description?: string | null;
  image_url?: string | null;
  location?: string | null;
  category_id: number;
  price?: number | null;
  owner_id?: number | null;
}

export interface OfferCreateDto {
  title: string;
  description?: string | null;
  image_url?: string | null;
  location?: string | null;
  category_id: number;
  price?: number | null;
}

export interface OfferUpdateDto extends OfferCreateDto {}

export interface UploadOfferImageResponseDto {
  detail: string;
  image_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private API_URL = 'http://127.0.0.1:8000';
  private offersUrl = `${this.API_URL}/offers/`;

  constructor(private http: HttpClient) {}

  private resolveImageUrl(url?: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.API_URL}${url}`;
  }

  getItems(): Observable<ListItem[]> {
    return this.http.get<any>(`${this.offersUrl}?page=1&page_size=50`).pipe(
      map((response) => {
        const offers = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
          ? response.items
          : [];

        return offers
          .sort((a: any, b: any) => Number(b.id) - Number(a.id))
          .map((o: any) => ({
            id: o.id,
            name: o.name ?? o.title ?? '',
            description: o.description ?? '',
            imageUrl: this.resolveImageUrl(o.image_url ?? o.imageUrl ?? null) ?? undefined,
            categoryId: o.category_id ?? o.categoryId,
            location: o.location ?? '',
          }));
      })
    );
  }

  createOffer(payload: OfferCreateDto): Observable<OfferDto> {
    return this.http.post<OfferDto>(this.offersUrl, payload).pipe(
      map((offer) => ({
        ...offer,
        image_url: this.resolveImageUrl(offer.image_url ?? null),
      }))
    );
  }

  getOfferById(id: number): Observable<OfferDto> {
    return this.http.get<OfferDto>(`${this.offersUrl}${id}`).pipe(
      map((offer) => ({
        ...offer,
        image_url: this.resolveImageUrl(offer.image_url ?? null),
      }))
    );
  }

  updateOffer(id: number, payload: OfferUpdateDto): Observable<OfferDto> {
    return this.http.put<OfferDto>(`${this.offersUrl}${id}`, payload).pipe(
      map((offer) => ({
        ...offer,
        image_url: this.resolveImageUrl(offer.image_url ?? null),
      }))
    );
  }

  deleteOffer(id: number): Observable<any> {
    return this.http.delete(`${this.offersUrl}${id}`);
  }

  uploadOfferImage(offerId: number, file: File): Observable<UploadOfferImageResponseDto> {
    const form = new FormData();
    form.append('file', file);

    return this.http.post<UploadOfferImageResponseDto>(
      `${this.offersUrl}${offerId}/image`,
      form
    ).pipe(
      map((response) => ({
        ...response,
        image_url: this.resolveImageUrl(response.image_url) || ''
      }))
    );
  }
}