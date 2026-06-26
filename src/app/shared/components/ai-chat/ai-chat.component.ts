import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AiChatService, AiChatMessage } from '../../../core/services/ai-chat.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss',
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  private readonly aiChatService = inject(AiChatService);
  private readonly authService = inject(AuthService);

  @ViewChild('messagesContainer') private readonly messagesContainer?: ElementRef<HTMLElement>;

  readonly isOpen = signal(false);
  readonly isLoading = signal(false);
  readonly messages = signal<AiChatMessage[]>([]);
  readonly sessionId = signal('');
  readonly inputValue = signal('');
  readonly isAuthenticated = this.authService.isLoggedIn;
  readonly historyError = signal('');
  private readonly loadedSessionId = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.resetChatState();
      return;
    }

    this.initializeChat();
  }

  toggleChat(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.isOpen.update((value) => !value);
    if (this.isOpen()) {
      this.initializeChat();
    }
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  sendMessage(): void {
    const text = this.inputValue().trim();
    if (!text || this.isLoading()) {
      return;
    }

    const sessionId = this.ensureSession();
    const userMessage: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    this.messages.update((messages) => [...messages, userMessage]);
    this.inputValue.set('');
    this.isLoading.set(true);
    this.historyError.set('');

    this.aiChatService.sendMessage(sessionId, text).subscribe({
      next: () => {
        this.refreshConversationFromBackend(sessionId);
      },
      error: () => {
        this.isLoading.set(false);
        this.historyError.set('The assistant is unavailable right now. Please try again in a moment.');
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private initializeChat(): void {
    if (!this.authService.isLoggedIn()) {
      this.resetChatState();
      return;
    }

    const sessionId = this.ensureSession();
    this.refreshConversationFromBackend(sessionId);
  }

  private ensureSession(): string {
    const storedSessionId = this.aiChatService.getStoredSessionId();
    if (storedSessionId) {
      this.sessionId.set(storedSessionId);
      return storedSessionId;
    }

    const nextSessionId = this.aiChatService.getOrCreateSessionId();
    this.sessionId.set(nextSessionId);
    return nextSessionId;
  }

  private refreshConversationFromBackend(sessionId: string): void {
    this.aiChatService.getHistory(sessionId).subscribe({
      next: (historyResult) => {
        this.loadedSessionId.set(sessionId);
        this.sessionId.set(historyResult.sessionId || sessionId);
        this.messages.set(historyResult.messages);
        this.isLoading.set(false);
        this.historyError.set('');
        this.scrollToBottom();
      },
      error: () => {
        this.isLoading.set(false);
        this.historyError.set('We could not reload your chat history right now. Your recent messages are still available in the conversation window.');
        this.scrollToBottom();
      },
    });
  }

  private resetChatState(): void {
    this.isOpen.set(false);
    this.messages.set([]);
    this.sessionId.set('');
    this.inputValue.set('');
    this.isLoading.set(false);
    this.historyError.set('');
    this.loadedSessionId.set(null);
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
