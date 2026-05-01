import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

import { ChatUiService } from '../../services/chat-ui.service';
import { ConversationResponse, MessageService } from '../../services/message.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss']
})
export class MessagesComponent implements OnInit, OnDestroy {
  conversations: ConversationResponse[] = [];
  loading = true;
  error: string | null = null;

  private subscription?: Subscription;

  constructor(
    private messageService: MessageService,
    private chatUiService: ChatUiService
  ) {}

  ngOnInit(): void {
    this.subscription = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => this.messageService.getConversations())
      )
      .subscribe({
        next: (conversations) => {
          this.conversations = conversations;
          this.loading = false;
          this.error = null;
        },
        error: (err) => {
          console.error('Błąd pobierania rozmów:', err);
          this.loading = false;
          this.error = 'Nie udało się pobrać rozmów.';
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  openConversation(conversation: ConversationResponse): void {
    this.chatUiService.openChat(
      conversation.other_user.username,
      conversation.other_user.id
    );
  }

  formatDate(value: string | null): string {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}