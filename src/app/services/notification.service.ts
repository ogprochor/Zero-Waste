// app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  private nextId = 0;

  show(notification: Notification): void {
    const id = this.nextId++;
    const notificationWithId = { ...notification, id };
    
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, notificationWithId]);

    if (notification.duration !== 0) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration || 5000);
    }
  }

  success(message: string, duration: number = 5000): void {
    this.show({ type: 'success', message, duration });
  }

  error(message: string, duration: number = 7000): void {
    this.show({ type: 'error', message, duration });
  }

  info(message: string, duration: number = 4000): void {
    this.show({ type: 'info', message, duration });
  }

  warning(message: string, duration: number = 5000): void {
    this.show({ type: 'warning', message, duration });
  }

  remove(id: number): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next(current.filter(n => n.id !== id));
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }
}