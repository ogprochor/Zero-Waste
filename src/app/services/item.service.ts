import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ListItem } from '../models/list-item';
import { AuthService } from './auth.service';

export interface OfferDto {
  id: number;
  title: string;
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

/** ✅ TYP ODPOWIEDZI Z UPLOADU */
export interface UploadResponseDto {
  urls: string[];
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  // proxy → backend
  private offersUrl = '/api/offers/';
  private uploadUrl = '/api/uploads';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private authHeaders(): HttpHeaders {
    const userId = this.authService.getCurrentUserId();
    return userId ? new HttpHeaders({ 'X-User-Id': String(userId) }) : new HttpHeaders();
  }

  getItems(): Observable<ListItem[]> {
    return this.http.get<OfferDto[]>(this.offersUrl).pipe(
      map((offers) =>
        (offers ?? []).map((o) => ({
          id: o.id,
          name: o.title,
          description: o.description ?? '',
          imageUrl: o.image_url ?? undefined,
          categoryId: o.category_id,
          location: o.location ?? '',
        }))
      )
    );
  }

  createOffer(payload: OfferCreateDto): Observable<OfferDto> {
    return this.http.post<OfferDto>(this.offersUrl, payload, {
      headers: this.authHeaders(),
    });
  }

  getOfferById(id: number): Observable<OfferDto> {
    return this.http.get<OfferDto>(`${this.offersUrl}${id}`);
  }

  updateOffer(id: number, payload: OfferUpdateDto): Observable<OfferDto> {
    return this.http.put<OfferDto>(`${this.offersUrl}${id}`, payload, {
      headers: this.authHeaders(),
    });
  }

  deleteOffer(id: number): Observable<any> {
    return this.http.delete(`${this.offersUrl}${id}`, {
      headers: this.authHeaders(),
    });
  }

  /** ✅ UPLOAD ZDJĘĆ */
  uploadImages(files: File[]): Observable<UploadResponseDto> {
    const form = new FormData();
    for (const f of files) {
      form.append('files', f);
    }
    return this.http.post<UploadResponseDto>(this.uploadUrl, form);
  }
}
