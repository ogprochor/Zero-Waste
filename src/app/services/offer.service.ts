import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Offer {
  id: number;
  title: string;
  name?:string;
  description?: string;
  image_url?: string;
  location?: string;
  price?: number;
  owner_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private apiUrl = 'http://127.0.0.1:8000/offers'; 

  constructor(private http: HttpClient) { }

  
  getOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.apiUrl}/`);
  }

 
  getOfferById(id: number): Observable<Offer> {
    return this.http.get<Offer>(`${this.apiUrl}/${id}`);
  }

  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}