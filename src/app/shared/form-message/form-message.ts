// app/shared/form-message/form-message.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="form-message" [class]="'form-message--' + type">
      <span class="form-message__icon">{{ icon }}</span>
      <span class="form-message__text">{{ message }}</span>
    </div>
  `,
  styles: [`
    .form-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 12px 0;
      font-size: 14px;
    }

    .form-message--error {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .form-message--success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .form-message--info {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .form-message--warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .form-message__icon {
      font-size: 16px;
      font-weight: bold;
    }
  `]
})
export class FormMessageComponent {
  @Input() type: 'error' | 'success' | 'info' | 'warning' = 'info';
  @Input() message: string | null = null;

  get icon(): string {
    switch (this.type) {
      case 'error': return '✗';
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  }
}