import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { ChatUiService } from '../../services/chat-ui.service';
import { AuthService } from '../../services/auth.service';
import { MessageResponse, MessageService } from '../../services/message.service';

interface ChatViewMessage {
  id: number;
  text: string;
  self: boolean;
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-chat-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-popup.html',
  styleUrls: ['./chat-popup.scss']
})
export class ChatPopupComponent implements OnInit, OnDestroy {
  isOpen$!: Observable<boolean>;
  sellerName$!: Observable<string>;

  message = '';
  messages: ChatViewMessage[] = [];
  loading = false;
  sending = false;
  error: string | null = null;

  private currentReceiverId: number | null = null;
  private subscriptions = new Subscription();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private chatService: ChatUiService,
    private messageService: MessageService,
    private authService: AuthService
  ) {
    this.isOpen$ = this.chatService.chatState$;
    this.sellerName$ = this.chatService.sellerName$;
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.chatService.sellerId$.subscribe((id) => {
        if (id !== this.currentReceiverId) {
          this.currentReceiverId = id;
          this.messages = [];
          this.error = null;

          if (id) {
            this.loadMessages(true);
            this.startAutoRefresh();
          }
        }
      })
    );

    this.subscriptions.add(
      this.chatService.chatState$.subscribe((isOpen) => {
        if (!isOpen) {
          this.stopAutoRefresh();
          return;
        }

        if (this.currentReceiverId) {
          this.loadMessages(true);
          this.startAutoRefresh();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.stopAutoRefresh();
  }

  close(): void {
    this.chatService.closeChat();
  }

  sendMessage(): void {
    const content = this.message.trim();

    if (!content || !this.currentReceiverId || this.sending) {
      return;
    }

    this.sending = true;
    this.error = null;
    this.message = '';

    this.messageService.sendMessage({
      receiver_id: this.currentReceiverId,
      content
    }).subscribe({
      next: (response) => {
        this.addOrReplaceMessage(response);
        this.sending = false;
        this.startAutoRefresh();
      },
      error: (err) => {
        console.error('Błąd wysyłania do backendu:', err);
        this.error = 'Błąd wysyłania. Upewnij się, że jesteś zalogowany.';
        this.message = content;
        this.sending = false;
      }
    });
  }

  trackByMessageId(index: number, msg: ChatViewMessage): number {
    return msg.id;
  }

  formatTime(value: string): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private loadMessages(showLoading: boolean): void {
    if (!this.currentReceiverId) {
      return;
    }

    if (showLoading) {
      this.loading = true;
    }

    this.messageService.getMessagesWithUser(this.currentReceiverId).subscribe({
      next: (messages) => {
        this.messages = messages.map((message) => this.toViewMessage(message));
        this.loading = false;
      },
      error: (err) => {
        console.error('Błąd pobierania wiadomości:', err);
        this.error = 'Nie udało się pobrać wiadomości.';
        this.loading = false;
      }
    });
  }

  private addOrReplaceMessage(message: MessageResponse): void {
    const viewMessage = this.toViewMessage(message);
    const existingIndex = this.messages.findIndex((item) => item.id === viewMessage.id);

    if (existingIndex >= 0) {
      this.messages[existingIndex] = viewMessage;
      this.messages = [...this.messages];
      return;
    }

    this.messages = [...this.messages, viewMessage];
  }

  private toViewMessage(message: MessageResponse): ChatViewMessage {
    const currentUserId = this.authService.getCurrentUserId();

    return {
      id: message.id,
      text: message.content,
      self: Number(message.sender_id) === Number(currentUserId),
      isRead: message.is_read,
      createdAt: message.created_at
    };
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();

    this.refreshTimer = setInterval(() => {
      this.loadMessages(false);
    }, 5000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}