import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoryDto {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  // proxy:
  private apiUrl = '/api/categories/';
  // bez proxy:
  // private apiUrl = 'http://127.0.0.1:8000/categories/';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(this.apiUrl);
  }
}
