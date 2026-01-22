import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CategoryService, CategoryDto } from '../../services/category.service';
import { ItemService, OfferCreateDto } from '../../services/item.service';

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
      next: (cats) => {
        this.categories = cats ?? [];
        this.loadingCategories = false;
      },
      error: () => {
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

    const limited = files.slice(0, 6);

    for (const f of limited) {
      if (!f.type.startsWith('image/')) continue;
      this.selectedFiles.push(f);
      this.previews.push(URL.createObjectURL(f));
    }

    input.value = '';
  }

  removeImage(index: number): void {
    const url = this.previews[index];
    if (url) URL.revokeObjectURL(url);

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
        title: v.title.trim(),
        description: v.description?.trim() || null,
        location: v.location?.trim() || null,
        category_id: Number(v.category_id),
        price: v.price != null && v.price !== '' ? Number(v.price) : null,
        image_url: null,
      };

      // ✅ NAJPIERW UPLOAD PLIKU
      if (this.selectedFiles.length > 0) {
        const uploadRes = await firstValueFrom(
          this.itemService.uploadImages(this.selectedFiles)
        );
        payload.image_url = uploadRes.urls[0] ?? null;
      }

      const created = await firstValueFrom(
        this.itemService.createOffer(payload)
      );

      this.success = 'Oferta dodana!';

      if (created?.id) {
        this.router.navigate(['/offers', created.id]);
      } else {
        this.router.navigate(['/lista']);
      }
    } catch (err) {
      console.error(err);
      this.error = 'Nie udało się dodać oferty.';
    } finally {
      this.submitting = false;
    }
  }
}
