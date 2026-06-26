import { Component, signal, ElementRef, ViewChild, AfterViewChecked, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../../../core/services/admin-api.service';

interface ChatMessage {
  id: string;
  role: 'admin' | 'ai';
  text: string;
}

interface ReportCategory {
  key: string;
  icon: 'bar' | 'package' | 'users' | 'layers' | 'factory' | 'message';
}

@Component({
  selector: 'app-admin-ai-reports',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-reports.component.html',
  styleUrl: './ai-reports.component.scss',
})
export class AiReportsComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollRef') scrollRef?: ElementRef<HTMLDivElement>;

  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);

  readonly categories: ReportCategory[] = [
    { key: 'Revenue', icon: 'bar' },
    { key: 'Orders', icon: 'package' },
    { key: 'Creators', icon: 'users' },
    { key: 'Products', icon: 'package' },
    { key: 'Templates', icon: 'layers' },
    { key: 'Production', icon: 'factory' },
    { key: 'Community', icon: 'message' },
  ];

  readonly suggestions = [
    'Why did sales drop this month?',
    'Who are the top creators this week?',
    'What are the most returned products?',
    'Overall report for Production',
    'Overall report for Revenue',
  ];

  readonly messages = signal<ChatMessage[]>([
    {
      id: 'm0',
      role: 'ai',
      text: 'Hi Admin — ask me anything about your business. I can analyse sales, orders, creators, products, templates, production, and community. Try one of the prompts below.',
    },
  ]);

  readonly input = signal('');
  readonly thinking = signal(false);
  readonly sessionId = signal<string | null>(null);
  readonly sessionError = signal<string | null>(null);

  ngOnInit(): void {
    this.adminApi.createReportChatSession().subscribe({
      next: (sessionId) => this.sessionId.set(sessionId),
      error: (err) => {
        this.sessionError.set(this.extractError(err, 'Unable to start report chat session.'));
        this.toast.error(this.sessionError()!);
      },
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const el = this.scrollRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  setInput(v: string): void {
    this.input.set(v);
  }

  sendCategoryReport(categoryKey: string): void {
    this.send(`Overall report for ${categoryKey}`);
  }

  sendSuggestion(prompt: string): void {
    this.send(prompt);
  }

  send(text?: string): void {
    const value = (text ?? this.input()).trim();
    if (!value || this.thinking()) return;

    const sessionId = this.sessionId();
    if (!sessionId) {
      this.toast.error(this.sessionError() ?? 'Report chat session is not ready yet.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'admin',
      text: value,
    };
    this.messages.update((m) => [...m, userMsg]);
    this.input.set('');
    this.thinking.set(true);

    this.adminApi.sendReportChatMessage(sessionId, value).subscribe({
      next: (response) => {
        this.thinking.set(false);
        this.messages.update((m) => [
          ...m,
          {
            id: response.aiMessageId ?? `a-${Date.now()}`,
            role: 'ai',
            text: response.response,
          },
        ]);
      },
      error: (err) => {
        this.thinking.set(false);
        this.toast.error(this.extractError(err, 'Report generation failed.'));
      },
    });
  }

  private extractError(error: unknown, fallback: string): string {
    const err = error as { error?: { message?: string; errors?: string[] } | string; message?: string };
    if (typeof err?.error === 'string') return err.error;
    return err?.error?.message ?? err?.error?.errors?.join(', ') ?? err?.message ?? fallback;
  }
}
