import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface CategoryDto {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private API_URL = 'http://127.0.0.1:8000/categories';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<any>(this.API_URL).pipe(
      map((res) => {

        if (Array.isArray(res)) {
          return res;
        }

        if (Array.isArray(res?.items)) {
          return res.items;
        }

        return [];
      })
    );
  }
}