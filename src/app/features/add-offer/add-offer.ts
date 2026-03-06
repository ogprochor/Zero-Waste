import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CategoryService, CategoryDto } from '../../services/category.service';
import {
  ItemService,
  OfferCreateDto,
  OfferDto,
  UploadOfferImageResponseDto
} from '../../services/item.service';

@Component({
  selector: 'app-add-offer',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, RouterLink],
  templateUrl: './add-offer.html',
  styleUrls: ['./add-offer.scss'],
})
export class AddOfferComponent implements OnInit, OnDestroy {
  categories: CategoryDto[] = [];

  loadingCategories = true;
  submitting = false;
  error: string | null = null;
  success: string | null = null;

  form!: FormGroup;

  selectedFiles: File[] = [];
  previews: string[] = [];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private itemService: ItemService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      location: [''],
      category_id: [null, [Validators.required]],
      price: [null],
    });

    this.categoryService.getCategories().subscribe({
      next: (cats: any) => {
        const normalizedCategories = Array.isArray(cats)
          ? cats
          : Array.isArray(cats?.items)
          ? cats.items
          : [];

        this.categories = normalizedCategories.map((c: any) => ({
          id: c.id,
          name: c.name,
        }));

        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Błąd pobierania kategorii:', err);
        this.error = 'Nie udało się pobrać kategorii.';
        this.loadingCategories = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.previews.forEach((u) => URL.revokeObjectURL(u));
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    this.previews.forEach((u) => URL.revokeObjectURL(u));
    this.previews = [];
    this.selectedFiles = [];

    const limited = files.slice(0, 1);

    for (const f of limited) {
      if (!f.type.startsWith('image/')) continue;
      this.selectedFiles.push(f);
      this.previews.push(URL.createObjectURL(f));
    }

    input.value = '';
  }

  removeImage(index: number): void {
    const url = this.previews[index];
    if (url) {
      URL.revokeObjectURL(url);
    }

    this.previews.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  async submit(): Promise<void> {
    this.error = null;
    this.success = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Uzupełnij wymagane pola.';
      return;
    }

    this.submitting = true;

    try {
      const v = this.form.value;

      const payload: OfferCreateDto = {
        title: String(v.title || '').trim(),
        description: v.description?.trim() || null,
        location: v.location?.trim() || null,
        category_id: Number(v.category_id),
        price: v.price != null && v.price !== '' ? Number(v.price) : null,
        image_url: null,
      };

      const created = await firstValueFrom(
        this.itemService.createOffer(payload)
      ) as OfferDto;

      if (this.selectedFiles.length > 0 && created?.id) {
        await firstValueFrom(
          this.itemService.uploadOfferImage(created.id, this.selectedFiles[0])
        ) as UploadOfferImageResponseDto;
      }

      this.success = 'Oferta dodana!';

      if (created?.id) {
        this.router.navigate(['/offers', created.id]);
      } else {
        this.router.navigate(['/lista']);
      }
    } catch (err: any) {
      console.error('Błąd dodawania oferty:', err);

      if (err?.error?.detail) {
        if (Array.isArray(err.error.detail)) {
          this.error = err.error.detail.map((e: any) => e.msg).join(', ');
        } else if (typeof err.error.detail === 'string') {
          this.error = err.error.detail;
        } else {
          this.error = 'Nie udało się dodać oferty.';
        }
      } else if (err?.status === 0) {
        this.error = 'Brak połączenia z backendem.';
      } else if (err?.status === 401) {
        this.error = 'Sesja wygasła. Zaloguj się ponownie.';
      } else if (err?.status === 422) {
        this.error = 'Backend odrzucił dane formularza.';
      } else {
        this.error = 'Nie udało się dodać oferty.';
      }
    } finally {
      this.submitting = false;
    }
  }
}