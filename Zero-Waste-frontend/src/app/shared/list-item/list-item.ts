import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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

  constructor(private sanitizer: DomSanitizer) {}

  get displayImage(): SafeUrl {
    const url = this.item?.imageUrl?.trim();

    // brak zdjęcia → placeholder
    if (!url) {
      return 'assets/images/zdj1.jpg';
    }

    // base64 (data:image/...)
    if (url.startsWith('data:image')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }

    // zwykły URL (/static/uploads/... lub http...)
    return url;
  }
}
