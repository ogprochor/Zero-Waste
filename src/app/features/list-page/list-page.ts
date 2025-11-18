import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { ListItem } from '../../models/list-item';
import { ListItemComponent } from '../../shared/list-item/list-item';

@Component({
  selector: 'app-list-page',
  standalone: true,
  imports: [NgFor, ListItemComponent],
  templateUrl: './list-page.html',
  styleUrls: ['./list-page.scss']
})
export class ListPageComponent {
  items: ListItem[] = [
    { id: '1', name: 'Książka', description: 'Opis książki', imageUrl: 'assets/images/zdj1.jpg' },
    { id: '2', name: 'Kubek', description: 'Ceramiczny kubek', imageUrl: 'assets/images/zdj2.png' },
    { id: '3', name: 'Długopis', description: 'Niebieski tusz', imageUrl: 'assets/images/zdj3.jpg' }
  ];
}
