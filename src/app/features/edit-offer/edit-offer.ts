import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CategoryService, CategoryDto } from '../../services/category.service';
import { ItemService, OfferDto, OfferUpdateDto } from '../../services/item.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-edit-offer',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink],
  templateUrl: './edit-offer.html',
  styleUrls: ['./edit-offer.scss'],
})
export class EditOfferComponent implements OnInit {
  offerId!: number;
  offer: OfferDto | null = null;
  categories: CategoryDto[] = [];

  loading = true;
  submitting = false;
  error: string | null = null;
  success: string | null = null;

  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private itemService: ItemService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      location: [''],
      category_id: [null, [Validators.required]],
      price: [null],
      image_url: [null],
    });

    this.offerId = Number(this.route.snapshot.paramMap.get('id'));

    try {
      const [offerResult, categories] = await Promise.all([
        firstValueFrom(this.itemService.getOfferById(this.offerId)),
        firstValueFrom(this.categoryService.getCategories()),
      ]);

      const offer = offerResult as OfferDto;

      this.offer = offer;
      this.categories = categories ?? [];

      const me = this.authService.getCurrentUserId();
      if (!me || offer.owner_id !== me) {
        this.router.navigate(['/offers', this.offerId], {
          queryParams: { msg: 'Brak uprawnień do edycji tej oferty.' },
        });
        return;
      }

      this.form.patchValue({
        title: offer.title ?? offer.name ?? '',
        description: offer.description ?? '',
        location: offer.location ?? '',
        category_id: offer.category_id ?? null,
        price: offer.price ?? null,
        image_url: offer.image_url ?? null,
      });
    } catch (err) {
      console.error(err);
      this.error = 'Nie udało się wczytać oferty.';
    } finally {
      this.loading = false;
    }
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

      const payload: OfferUpdateDto = {
        title: String(v.title || '').trim(),
        description: v.description?.trim() || null,
        location: v.location?.trim() || null,
        category_id: Number(v.category_id),
        price: v.price != null && v.price !== '' ? Number(v.price) : null,
        image_url: v.image_url || null,
      };

      await firstValueFrom(this.itemService.updateOffer(this.offerId, payload));

      this.router.navigate(['/offers', this.offerId], {
        queryParams: { msg: 'Oferta została zaktualizowana.' },
      });
    } catch (err: any) {
      console.error(err);
      this.error = err?.error?.detail || 'Nie udało się zaktualizować oferty.';
    } finally {
      this.submitting = false;
    }
  }
}