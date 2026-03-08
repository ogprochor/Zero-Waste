import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ListItemComponent } from '../../shared/list-item/list-item';
import { ItemService } from '../../services/item.service';
import { CategoryService, CategoryDto } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-list-page',
  standalone: true,
  templateUrl: './list-page.html',
  styleUrls: ['./list-page.scss'],
  imports: [NgFor, NgIf, FormsModule, RouterLink, ListItemComponent],
})
export class ListPageComponent implements OnInit {
  items: any[] = [];
  loading = true;
  error: string | null = null;

  categories: CategoryDto[] = [];
  private categoryMap = new Map<number, string>();

  searchTerm = '';
  selectedCategory = 'Wszystkie';
  selectedCity = '';
  selectedType: 'free' | 'exchange' | 'sell' | '' = '';
  sortOption: 'newest' | 'name-asc' | 'name-desc' = 'newest';

  constructor(
    private router: Router,
    private itemService: ItemService,
    private categoryService: CategoryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    forkJoin({
      offers: this.itemService.getItems(),
      categories: this.categoryService.getCategories(),
    }).subscribe({
      next: ({ offers, categories }) => {
        this.categories = categories ?? [];
        this.categoryMap = new Map(this.categories.map((c) => [c.id, c.name]));

        this.items = (offers ?? []).map((o: any) => {
          const categoryId = o.categoryId ?? o.category_id ?? -1;

          return {
            id: o.id,
            name: o.name ?? o.title ?? '',
            description: o.description ?? '',
            category: this.categoryMap.get(categoryId) ?? 'Brak kategorii',
            city: String(o.location ?? '').trim(),
            type: o.type ?? '',
            createdAt: o.createdAt ?? null,
            imageUrl: o.imageUrl ?? o.image_url ?? null,
          };
        });

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Nie udało się pobrać ofert/kategorii z backendu.';
        this.loading = false;
      },
    });
  }

  goToDetails(id: number): void {
    this.router.navigate(['/offers', id]);
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  setType(type: 'free' | 'exchange' | 'sell'): void {
    this.selectedType = type;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'Wszystkie';
    this.selectedCity = '';
    this.selectedType = '';
    this.sortOption = 'newest';
  }

  get filteredItems(): any[] {
    const search = this.searchTerm.toLowerCase().trim();
    const city = this.selectedCity.toLowerCase().trim();

    let result = this.items.filter((item) => {
      const name = String(item.name || '').toLowerCase();
      const description = String(item.description || '').toLowerCase();
      const category = String(item.category || '');
      const itemCity = String(item.city || '').toLowerCase();
      const type = String(item.type || '');

      const matchesSearch = !search || name.includes(search) || description.includes(search);
      const matchesCategory = this.selectedCategory === 'Wszystkie' || category === this.selectedCategory;
      const matchesCity = !city || itemCity.includes(city);
      const matchesType = !this.selectedType || type === this.selectedType;

      return matchesSearch && matchesCategory && matchesCity && matchesType;
    });

    result = [...result];

    switch (this.sortOption) {
      case 'name-asc':
        result.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        break;
      case 'name-desc':
        result.sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
        break;
      case 'newest':
      default:
        break;
    }

    return result;
  }
}