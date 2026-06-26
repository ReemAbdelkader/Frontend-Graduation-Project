import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface AiChatHistoryResponse {
  data?: {
    sessionId?: string;
    messages?: Array<{
      id?: string;
      sender?: string;
      messageText?: string;
      sentAt?: string;
      message?: string;
      content?: string;
      text?: string;
      role?: string;
      type?: string;
      speaker?: string;
      timestamp?: string;
      createdAt?: string;
      createdOn?: string;
    }> | null;
  } | null;
}

interface AiChatSendResponse {
  message?: string;
  content?: string;
  text?: string;
  response?: string;
  data?: {
    message?: string;
    content?: string;
    text?: string;
    response?: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/AiChat`;
  private readonly storageKey = 'wearly.ai.sessionId';

  getStoredSessionId(): string | null {
    const existing = localStorage.getItem(this.storageKey)?.trim();
    return existing || null;
  }

  getOrCreateSessionId(): string {
    const existing = this.getStoredSessionId();
    if (existing) {
      return existing;
    }

    const generated = this.createGuid();
    localStorage.setItem(this.storageKey, generated);
    return generated;
  }

  clearSessionId(): void {
    localStorage.removeItem(this.storageKey);
  }

  getHistory(sessionId: string): Observable<{ sessionId: string; messages: AiChatMessage[] }> {
    return this.http.get<unknown>(`${this.baseUrl}/history/${encodeURIComponent(sessionId)}`).pipe(
      map((response) => this.normalizeHistory(response, sessionId)),
      catchError(() => of({ sessionId, messages: [] })),
    );
  }

  sendMessage(sessionId: string, messageText: string): Observable<AiChatMessage> {
    return this.http.post<AiChatSendResponse>(`${this.baseUrl}/send`, { sessionId, messageText }).pipe(
      map((response) => this.normalizeAssistantMessage(response)),
      catchError(() => of(this.createFallbackAssistantMessage('I’m having trouble answering right now. Please try again.'))),
    );
  }

  private normalizeHistory(response: unknown, fallbackSessionId: string): { sessionId: string; messages: AiChatMessage[] } {
    const historyResponse = response as AiChatHistoryResponse;
    const sessionId = historyResponse?.data?.sessionId?.trim() || fallbackSessionId;
    const sourceMessages = historyResponse?.data?.messages ?? [];

    const messages = sourceMessages
      .map((item: any, index: number) => {
        const role = this.normalizeRole(item?.sender ?? item?.role ?? item?.type ?? item?.speaker);
        const content = this.extractText(item);
        const timestamp = item?.sentAt ?? item?.timestamp ?? item?.createdAt ?? item?.createdOn;

        return {
          id: item?.id ?? `${role}-${index}-${Date.now()}`,
          role,
          content,
          timestamp,
        };
      })
      .sort((left, right) => this.sortByTimestamp(left.timestamp, right.timestamp));

    return { sessionId, messages };
  }

  private normalizeRole(value: unknown): 'user' | 'assistant' {
    const normalized = typeof value === 'string' ? value.toLowerCase() : '';
    if (normalized === 'assistant' || normalized === 'ai_assistant' || normalized === 'ai' || normalized === 'bot') {
      return 'assistant';
    }
    return 'user';
  }

  private extractText(item: any): string {
    const candidates = [item?.messageText, item?.message, item?.content, item?.text, item?.body, item?.response];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
    return 'New message';
  }

  private normalizeAssistantMessage(response: AiChatSendResponse): AiChatMessage {
    return this.createAssistantMessage(this.extractReply(response));
  }

  private extractReply(response: AiChatSendResponse): string {
    const candidates = [response?.message, response?.content, response?.text, response?.response, response?.data?.message, response?.data?.content, response?.data?.text, response?.data?.response];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
    return 'Thanks! I have your request and will help you shortly.';
  }

  private createAssistantMessage(content: string): AiChatMessage {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };
  }

  private createFallbackAssistantMessage(content: string): AiChatMessage {
    return this.createAssistantMessage(content);
  }

  private sortByTimestamp(left?: string, right?: string): number {
    const leftTime = left ? new Date(left).getTime() : 0;
    const rightTime = right ? new Date(right).getTime() : 0;
    return leftTime - rightTime;
  }

  private createGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
      const random = (Math.random() * 16) | 0;
      const value = character === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}
