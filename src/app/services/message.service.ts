import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CurrentUser } from './auth.service';

export interface MessageSendRequest {
  receiver_id: number;
  content: string;
}

export interface MessageResponse {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface ConversationResponse {
  id: number;
  other_user: CurrentUser;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private apiUrl = 'http://127.0.0.1:8000/messages';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  sendMessage(payload: MessageSendRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  getConversations(): Observable<ConversationResponse[]> {
    return this.http.get<ConversationResponse[]>(`${this.apiUrl}/conversations`, {
      headers: this.getAuthHeaders()
    });
  }

  getConversationMessages(conversationId: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.apiUrl}/conversations/${conversationId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getMessagesWithUser(otherUserId: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.apiUrl}/with-user/${otherUserId}`, {
      headers: this.getAuthHeaders()
    });
  }
}