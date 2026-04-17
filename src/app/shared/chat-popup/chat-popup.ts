import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatUiService } from '../../services/chat-ui.service';
import { MessageService } from '../../services/message.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-popup.html',
  styleUrls: ['./chat-popup.scss']
})
export class ChatPopupComponent implements OnInit {
  isOpen$!: Observable<boolean>;
  sellerName$!: Observable<string>;
  
  message: string = '';
  messages: {text: string, self: boolean}[] = [];
  private currentReceiverId: number | null = null;

  constructor(
    private chatService: ChatUiService,
    private messageService: MessageService
  ) {
    this.isOpen$ = this.chatService.chatState$;
    this.sellerName$ = this.chatService.sellerName$;
  }

  ngOnInit(): void {
    this.chatService.sellerId$.subscribe(id => {
      if (id !== this.currentReceiverId) {
        this.currentReceiverId = id;
        this.messages = []; // Czyścimy okno przy zmianie rozmówcy
      }
    });
  }

  close() {
    this.chatService.closeChat();
  }

  sendMessage() {
    if (this.message.trim() && this.currentReceiverId) {
      const payload = {
        receiver_id: this.currentReceiverId,
        content: this.message
      };

      this.messageService.sendMessage(payload).subscribe({
        next: (res) => {
          this.messages.push({ text: res.content, self: true });
          this.message = '';
        },
        error: (err) => {
          console.error('Błąd wysyłania do backendu:', err);
          alert('Błąd wysyłania. Upewnij się, że jesteś zalogowany.');
        }
      });
    }
  }
}