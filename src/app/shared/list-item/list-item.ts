import { Component, Input } from '@angular/core';
import { ListItem } from '../../models/list-item';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.html',
  styleUrls: ['./list-item.scss']
})
export class ListItemComponent {
  @Input() item!: ListItem;

  get displayImage(): string {
    return this.item.imageUrl && this.item.imageUrl.trim().length > 0
      ? this.item.imageUrl
      : 'https://placehold.co/120x120?text=Foto';
  }
}
