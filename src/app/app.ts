import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { NotificationComponent } from './shared/notification/notification';
import { ChatPopupComponent } from './shared/chat-popup/chat-popup'; // DODAJ TO

@Component({
  selector: 'app-root',
  standalone: true, // Upewnij się, że masz to, skoro używasz imports
  imports: [
    RouterOutlet, 
    NotificationComponent, 
    ChatPopupComponent // DODAJ TO
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('zero_waste');

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.initAuth();
  }
}