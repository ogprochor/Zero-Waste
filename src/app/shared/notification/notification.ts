// app/shared/notification/notification.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div 
        *ngFor="let notification of notifications" 
        class="notification" 
        [class]="'notification--' + notification.type"
        (click)="remove(notification.id!)"
      >
        <div class="notification__icon">
          <span *ngIf="notification.type === 'success'">✓</span>
          <span *ngIf="notification.type === 'error'">✗</span>
          <span *ngIf="notification.type === 'warning'">⚠</span>
          <span *ngIf="notification.type === 'info'">ℹ</span>
        </div>
        <div class="notification__message">{{ notification.message }}</div>
        <button class="notification__close">×</button>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    }

    .notification {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border-left: 4px solid;
      animation: slideIn 0.3s ease;
      cursor: pointer;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification--success {
      border-left-color: var(--zw-primary);
    }

    .notification--error {
      border-left-color: #dc3545;
    }

    .notification--warning {
      border-left-color: #ffc107;
    }

    .notification--info {
      border-left-color: #17a2b8;
    }

    .notification__icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .notification__message {
      flex: 1;
      font-size: 14px;
    }

    .notification__close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.5;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notification__close:hover {
      opacity: 1;
    }
  `]
})
export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  remove(id: number): void {
    this.notificationService.remove(id);
  }
}