import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ListItemComponent } from '../../shared/list-item/list-item';
import { OfferService, Offer } from '../../services/offer.service';
import { CategoryService, CategoryDto } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { ListItem } from '../../models/list-item';

@Component({
  selector: 'app-list-page',
  standalone: true,
  templateUrl: './list-page.html',
  styleUrls: ['./list-page.scss'],
  imports: [NgFor, NgIf, FormsModule, RouterLink, ListItemComponent],
})
export class ListPageComponent implements OnInit {
  items: ListItem[] = [];
  loading = true;
  error: string | null = null;

  categories: CategoryDto[] = [];
  private categoryMap = new Map<number, string>();

  // Paginacja
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // Filtry
  searchTerm = '';
  selectedCategory = 'Wszystkie';
  selectedCity = '';
  selectedType: 'free' | 'exchange' | 'sell' | '' = '';
  sortOption: 'newest' | 'name-asc' | 'name-desc' = 'newest';

  constructor(
    private router: Router,
    private offerService: OfferService,
    private categoryService: CategoryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCategoriesAndOffers();
  }

  loadCategoriesAndOffers(): void {
    this.loading = true;
    
    forkJoin({
      categories: this.categoryService.getCategories(),
      offers: this.offerService.getOffers({
        page: this.currentPage,
        page_size: this.pageSize
      })
    }).subscribe({
      next: ({ categories, offers }) => {
        this.categories = categories ?? [];
        this.categoryMap = new Map(this.categories.map(c => [c.id, c.name]));
        
        this.totalItems = offers.total;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        this.items = offers.items.map(offer => ({
          ...this.offerService.toListItem(offer),
          category: this.categoryMap.get(offer.category_id) ?? 'Brak kategorii'
        }));

        this.loading = false;
      },
      error: (err) => {
        console.error('Błąd ładowania danych:', err);
        this.error = 'Nie udało się pobrać ofert.';
        this.loading = false;
      }
    });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadCategoriesAndOffers();
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

  applyFilters(): void {
    this.currentPage = 1;
    this.loadCategoriesAndOffers();
  }

  get filteredItems(): ListItem[] {
    const search = this.searchTerm.toLowerCase().trim();
    const city = this.selectedCity.toLowerCase().trim();

    let result = this.items.filter((item) => {
      const name = String(item.name || '').toLowerCase();
      const description = String(item.description || '').toLowerCase();
      const category = String(item.category || '');
      const itemCity = String(item.city || '').toLowerCase();

      const matchesSearch =
        !search || name.includes(search) || description.includes(search);

      const matchesCategory =
        this.selectedCategory === 'Wszystkie' ||
        category === this.selectedCategory;

      const matchesCity = !city || itemCity.includes(city);

      return matchesSearch && matchesCategory && matchesCity;
    });

    result = [...result];
    switch (this.sortOption) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        result.sort((a, b) => b.id - a.id);
        break;
    }

    return result;
  }
  
}