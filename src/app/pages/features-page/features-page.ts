import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './features-page.html',
  styleUrl: './features-page.scss'
})
export class FeaturesPageComponent {}