import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListItem } from '../../models/list-item';

@Component({
  selector: 'app-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-item.html',
  styleUrls: ['./list-item.scss'],
})
export class ListItemComponent {
  @Input() item!: ListItem;

  get displayImage(): string {
    const url = this.item?.imageUrl?.trim();

    if (!url) {
      return 'assets/images/zdj1.jpg';
    }

    return url;
  }
}