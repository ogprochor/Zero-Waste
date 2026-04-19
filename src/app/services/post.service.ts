import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Post {
  id?: number;
  content: string;
  user_id?: number;
  created_at: string;
  likes?: number;
  comments?: number;
  liked?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private API_URL = 'http://localhost:8000/posts';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getMyPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.API_URL}/me`, {
      headers: this.getAuthHeaders()
    });
  }

  createPost(post: { content: string }): Observable<Post> {
    return this.http.post<Post>(this.API_URL, { content: post.content }, {
      headers: this.getAuthHeaders()
    });
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.API_URL}/`);
  }

  getUserPosts(userId: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.API_URL}/user/${userId}`);
  }

  updatePost(id: number, content: string): Observable<Post> {
    return this.http.put<Post>(`${this.API_URL}/${id}`, { content }, {
      headers: this.getAuthHeaders()
    });
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  toggleLike(postId: number): Observable<{ liked: boolean }> {
    return this.http.post<{ liked: boolean }>(`${this.API_URL}/${postId}/like`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getLikesCount(postId: number): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/${postId}/likes-count`);
  }

  getUserLiked(postId: number): Observable<{ liked: boolean }> {
    return this.http.get<{ liked: boolean }>(`${this.API_URL}/${postId}/user-liked`, {
      headers: this.getAuthHeaders()
    });
  }
}