import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ListItem } from '../models/list-item';

export interface OfferDto {
  id: number;
  title: string;
  description?: string | null;
  image_url?: string | null;
  location?: string | null;
  category_id: number;
}

export interface OfferCreateDto {
  title: string;
  description?: string | null;
  image_url?: string | null;
  location?: string | null;
  category_id: number;
}

/** ✅ TYP ODPOWIEDZI Z UPLOADU */
export interface UploadResponseDto {
  urls: string[];
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  // proxy → backend
  private offersUrl = '/api/offers/';
  private uploadUrl = '/api/uploads';

  constructor(private http: HttpClient) {}

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
    return this.http.post<OfferDto>(this.offersUrl, payload);
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
