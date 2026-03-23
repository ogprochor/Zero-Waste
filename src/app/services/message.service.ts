import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class MessageService {
  
  private apiUrl = 'http://127.0.0.1:8000/messages';

  constructor(private http: HttpClient) {}

  
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Wysyła nową wiadomość. 
  
   */
  sendMessage(payload: MessageSendRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Pobiera historię wiadomości dla konkretnej konwersacji
   */
  getConversationMessages(conversationId: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.apiUrl}/conversations/${conversationId}`, {
      headers: this.getAuthHeaders()
    });
  }
}