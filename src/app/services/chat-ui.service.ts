import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatUiService {
  private chatOpen = new BehaviorSubject<boolean>(false);
  private sellerName = new BehaviorSubject<string>('');
  private sellerId = new BehaviorSubject<number | null>(null);

  chatState$ = this.chatOpen.asObservable();
  sellerName$ = this.sellerName.asObservable();
  sellerId$ = this.sellerId.asObservable();

  openChat(name: string, id: number) {
    this.sellerName.next(name);
    this.sellerId.next(id);
    this.chatOpen.next(true);
  }

  closeChat() {
    this.chatOpen.next(false);
  }
}