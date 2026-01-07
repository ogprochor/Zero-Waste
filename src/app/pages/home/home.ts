import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ListItem } from '../../models/list-item';
import { ListItemComponent } from '../../shared/list-item/list-item';
import { ItemService } from '../../services/item.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ListItemComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  items: ListItem[] = [];
  loading = true;
  error: string | null = null;

  constructor(private itemService: ItemService) {}

  ngOnInit(): void {
    this.itemService.getItems().subscribe({
      next: (data) => {
        // na stronie głównej pokazujemy np. 6 ostatnich
        this.items = (data ?? []).slice(0, 6);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Nie udało się pobrać ofert z backendu.';
        this.loading = false;
        console.error(err);
      },
    });
  }
}
