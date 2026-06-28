import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../core/services/chat-service';
interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  createdAt: Date;
}

@Component({
  selector: 'app-hr-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <button class="chat-fab" mat-fab color="primary" (click)="toggleOpen()" matTooltip="Assistant RH">
      <mat-icon>{{ opened() ? 'close' : 'smart_toy' }}</mat-icon>
    </button>

    @if (opened()) {
      <mat-card class="chat-panel">
        <div class="chat-header">
          <div>
            <h3>Assistant RH</h3>
            <p>Posez votre question</p>
          </div>
        </div>

        <div class="chat-body">
          @for (msg of messages(); track $index) {
            <div class="message" [class.user]="msg.sender === 'user'" [class.bot]="msg.sender === 'bot'">
              {{ msg.text }}
            </div>
          }

          @if (loading()) {
            <div class="typing">
              <mat-spinner diameter="22"></mat-spinner>
              <span>Réponse en cours...</span>
            </div>
          }
        </div>

        <div class="chat-footer">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Votre message</mat-label>
            <input
              matInput
              [(ngModel)]="draft"
              (keydown.enter)="send()"
              placeholder="Ex: combien de jours de congé me restent ?"
            />
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="send()" [disabled]="loading() || !draft.trim()">
            Envoyer
          </button>
        </div>
      </mat-card>
    }
  `,
  styles: [`
    .chat-fab {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 1000;
    }

    .chat-panel {
      position: fixed;
      right: 24px;
      bottom: 96px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 540px;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      border-radius: 16px;
      overflow: hidden;
    }

    .chat-header {
      padding: 16px;
      border-bottom: 1px solid #eee;
      background: #fafafa;
    }

    .chat-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .chat-header p {
      margin: 4px 0 0;
      color: #666;
      font-size: 13px;
    }

    .chat-body {
      flex: 1;
      overflow: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f7f8fa;
    }

    .message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      white-space: pre-wrap;
      line-height: 1.4;
    }

    .message.user {
      align-self: flex-end;
      background: #1976d2;
      color: white;
    }

    .message.bot {
      align-self: flex-start;
      background: white;
      border: 1px solid #e0e0e0;
      color: #222;
    }

    .typing {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .chat-footer {
      padding: 12px 16px 16px;
      border-top: 1px solid #eee;
      background: white;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full-width {
      width: 100%;
    }

    @media (max-width: 600px) {
      .chat-panel {
        right: 8px;
        left: 8px;
        bottom: 80px;
        width: auto;
        height: 70vh;
      }

      .chat-fab {
        right: 16px;
        bottom: 16px;
      }
    }
  `]
})
export class ChatComponent {
  private chatService = inject(ChatService);

  opened = signal(false);
  loading = signal(false);
  draft = '';

  messages = signal<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Bonjour, je suis votre assistant RH. Comment puis-je vous aider ?',
      createdAt: new Date()
    }
  ]);

  toggleOpen(): void {
    this.opened.update(v => !v);
  }

  send(): void {
    const message = this.draft.trim();
    if (!message || this.loading()) return;

    this.messages.update(list => [
      ...list,
      { sender: 'user', text: message, createdAt: new Date() }
    ]);

    this.draft = '';
    this.loading.set(true);

    this.chatService.ask(message).subscribe({
      next: res => {
        this.messages.update(list => [
          ...list,
          {
            sender: 'bot',
            text: res.response ?? 'Aucune réponse reçue.',
            createdAt: new Date()
          }
        ]);
        this.loading.set(false);
      },
      error: err => {
        const backendMsg = err?.error?.message || err?.error?.error;
        this.messages.update(list => [
          ...list,
          {
            sender: 'bot',
            text: backendMsg ?? 'Une erreur est survenue lors de la communication avec le service.',
            createdAt: new Date()
          }
        ]);
        this.loading.set(false);
      }
    });
  }

}
