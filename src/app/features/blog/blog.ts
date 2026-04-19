import { Component, OnInit } from '@angular/core';
import { PostService, Post } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BlogComponent implements OnInit {
  posts: Post[] = [];
  newPostContent: string = '';
  addingPost = false;
  loading = false;

  editingPostId: number | null = null;
  editContent: string = '';

  userNames: Map<number, string> = new Map();

  constructor(
    private postService: PostService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.loading = true;
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.loading = false;
        this.loadUserNames();
        // Tylko jeśli użytkownik jest zalogowany – pobierz stan like'ów
        if (this.authService.isLoggedIn()) {
          this.loadUserLikes();
        }
      },
      error: (err) => {
        console.error('Błąd ładowania:', err);
        this.loading = false;
      }
    });
  }

  loadUserLikes() {
    this.posts.forEach(post => {
      if (post.id) {
        this.postService.getUserLiked(post.id).subscribe({
          next: (res) => {
            post.liked = res.liked;
          },
          error: (err) => {
            console.error('Błąd pobierania like:', err);
            post.liked = false;
          }
        });
      }
    });
  }

  loadUserNames() {
    const uniqueUserIds = [...new Set(this.posts.map(p => p.user_id).filter(id => id))];
    
    uniqueUserIds.forEach(userId => {
      if (userId && !this.userNames.has(userId)) {
        this.authService.getUserById(userId).subscribe({
          next: (user) => {
            this.userNames.set(userId, user.username);
          },
          error: () => {
            this.userNames.set(userId, `Użytkownik ${userId}`);
          }
        });
      }
    });
  }

  getUserName(userId?: number): string {
    if (!userId) return 'Społeczność Zero Waste';
    return this.userNames.get(userId) || `Użytkownik ${userId}`;
  }

  canEditPost(post: Post): boolean {
    const currentUserId = this.authService.getCurrentUserId();
    return !!currentUserId && post.user_id === currentUserId;
  }

  addPost() {
    if (!this.newPostContent.trim() || this.addingPost) return;
    
    if (!this.authService.isLoggedIn()) {
      alert('Musisz być zalogowany, aby dodać post!');
      return;
    }

    this.addingPost = true;
    this.postService.createPost({
      content: this.newPostContent
    }).subscribe({
      next: (newPost) => {
        newPost.liked = false;
        newPost.likes = 0;
        newPost.comments = 0;
        this.posts.unshift(newPost);
        this.newPostContent = '';
        this.addingPost = false;
        this.loadUserNames();
      },
      error: (err) => {
        console.error('Błąd dodawania:', err);
        this.addingPost = false;
        alert('Nie udało się dodać posta. Sprawdź czy jesteś zalogowany.');
      }
    });
  }

  startEdit(post: Post) {
    this.editingPostId = post.id!;
    this.editContent = post.content;
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editContent = '';
  }

  saveEdit(postId: number) {
    if (!this.editContent.trim()) return;

    this.postService.updatePost(postId, this.editContent).subscribe({
      next: (updatedPost) => {
        const index = this.posts.findIndex(p => p.id === postId);
        if (index !== -1) {
          updatedPost.liked = this.posts[index].liked;
          updatedPost.likes = this.posts[index].likes;
          this.posts[index] = updatedPost;
        }
        this.cancelEdit();
      },
      error: (err) => {
        console.error('Błąd edycji:', err);
        alert('Nie udało się zaktualizować posta');
      }
    });
  }

  deletePost(postId: number) {
    if (!confirm('Czy na pewno chcesz usunąć ten post?')) return;

    this.postService.deletePost(postId).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== postId);
      },
      error: (err) => {
        console.error('Błąd usuwania:', err);
        alert('Nie udało się usunąć posta');
      }
    });
  }

  toggleLike(post: any) {
    // Sprawdź czy użytkownik jest zalogowany
    if (!this.authService.isLoggedIn()) {
      alert('Zaloguj się, aby polubić post!');
      return;
    }

    const wasLiked = post.liked === true;
    const oldLikes = post.likes || 0;
    
    // Optimistic update
    post.liked = !wasLiked;
    post.likes = wasLiked ? oldLikes - 1 : oldLikes + 1;
    
    this.postService.toggleLike(post.id).subscribe({
      next: (res) => {
        post.liked = res.liked;
        // Odśwież liczbę like'ów z backendu
        this.postService.getLikesCount(post.id).subscribe(count => {
          post.likes = count;
        });
      },
      error: (err) => {
        console.error('Błąd like:', err);
        // Rollback on error
        post.liked = wasLiked;
        post.likes = oldLikes;
        if (err.status === 401) {
          alert('Sesja wygasła. Zaloguj się ponownie.');
        } else {
          alert('Nie udało się polubić posta');
        }
      }
    });
  }
}