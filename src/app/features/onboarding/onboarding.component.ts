import { Component, ElementRef, ViewChild, inject, signal, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { logoImage } from '../../core/data/wearly-data';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

/**
 * AI Onboarding Chat page (user-only, full-screen).
 *
 * This is a DEDICATED onboarding flow shown once right after signup/login.
 * It is completely separate from the floating chat assistant bubble that
 * appears on every page. After the user finishes the chat (or skips), they
 * are redirected to /dashboard.
 *
 * The chat uses a scripted AI conversation that adapts to the user's
 * answers — no backend calls. Your team can later swap the `send()`
 * method with a real /api/AiChat/send call.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent implements AfterViewChecked {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly logo = logoImage;
  readonly firstName = (this.auth.user()?.name ?? 'there').split(' ')[0];

  @ViewChild('scrollRef') scrollRef?: ElementRef<HTMLDivElement>;

  readonly messages = signal<ChatMessage[]>([
    {
      id: 'm0',
      role: 'ai',
      text: `Hi ${this.firstName} — I'm Atelier, your personal style co-pilot. Let's spend a minute getting to know your taste so I can recommend the right garments and templates. What are 2–3 of your favorite colors?`,
    },
  ]);

  readonly input = signal('');
  readonly thinking = signal(false);

  /** Tracks which scripted step we're on (0 = colors, 1 = styles, 2 = garments, 3 = occasions, 4 = done). */
  private step = 0;

  /** Quick-reply prompts shown as chips under the conversation. */
  readonly quickReplies = signal<string[]>([
    'Earthy tones — olive, sand, terracotta',
    'Black, white, and gray',
    'Coral, violet, mint',
  ]);

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

  useQuickReply(q: string): void {
    if (q.toLowerCase().includes('skip')) {
      this.finish();
      return;
    }
    this.send(q);
  }

  send(text?: string): void {
    const value = (text ?? this.input()).trim();
    if (!value || this.thinking()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: value,
    };
    this.messages.update((m) => [...m, userMsg]);
    this.input.set('');
    this.thinking.set(true);

    // Scripted AI reply — adapts to the user's progress.
    setTimeout(() => {
      const reply = this.nextAiReply(value);
      this.thinking.set(false);
      this.messages.update((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: 'ai', text: reply },
      ]);
      this.step++;
      this.updateQuickReplies();
    }, 700);
  }

  /** Returns the next scripted AI reply based on the current step. */
  private nextAiReply(userText: string): string {
    switch (this.step) {
      case 0:
        return `Love those choices. Now — what styles do you naturally gravitate toward? Casual, formal, streetwear, minimalist, sporty, or something else?`;
      case 1:
        return `Got it. Which garment types are wardrobe staples for you? (e.g. t-shirts, hoodies, pants, sneakers, caps)`;
      case 2:
        return `Perfect. Last question — what occasions do you usually dress for? Work, weekends, nights out, gym, travel?`;
      case 3:
        return `That's everything I need. I've saved your style profile — your dashboard and recommendations are now tuned to your taste. Welcome to Atelier.`;
      default:
        return `You're all set! Click "Finish & continue" below to enter your dashboard.`;
    }
  }

  /** Updates the quick-reply chips based on the current step. */
  private updateQuickReplies(): void {
    switch (this.step) {
      case 1:
        this.quickReplies.set([
          'Casual & comfortable',
          'Streetwear & oversized',
          'Minimal & tailored',
        ]);
        break;
      case 2:
        this.quickReplies.set([
          'Hoodies & tees',
          'Pants & sneakers',
          'Caps & accessories',
        ]);
        break;
      case 3:
        this.quickReplies.set([
          'Work & meetings',
          'Weekends & social',
          'Gym & active',
        ]);
        break;
      default:
        this.quickReplies.set(['Skip & continue to dashboard']);
    }
  }

  /** Mark onboarding complete and navigate to /dashboard. */
  finish(): void {
    this.auth.markOnboardingComplete();
    this.toast.success('Style profile saved — welcome to Atelier!');
    this.router.navigate(['/dashboard']);
  }

  /** Sign out and bail to /auth. */
  signOut(): void {
    this.auth.logout().subscribe((result) => {
      if (result.ok) {
        this.toast.success(result.message ?? 'Signed out successfully.');
        this.router.navigate(['/auth']);
      } else {
        this.toast.error(result.message ?? result.error ?? 'Logout failed.');
      }
    });
  }
}