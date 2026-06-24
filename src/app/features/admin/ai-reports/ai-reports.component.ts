import { Component, signal, ElementRef, ViewChild, AfterViewChecked, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  id: string;
  role: 'admin' | 'ai';
  text?: string;
  reportTitle?: string;
  reportSummary?: string;
  reportMetrics?: { label: string; value: string; trend: string; delta?: string }[];
  reportInsights?: { kind: 'positive' | 'negative' | 'neutral'; text: string }[];
  reportRecommendations?: string[];
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
export class AiReportsComponent implements AfterViewChecked {
  @ViewChild('scrollRef') scrollRef?: ElementRef<HTMLDivElement>;

  readonly categories: ReportCategory[] = [
    { key: 'Revenue',    icon: 'bar' },
    { key: 'Orders',     icon: 'package' },
    { key: 'Creators',   icon: 'users' },
    { key: 'Products',   icon: 'package' },
    { key: 'Templates',  icon: 'layers' },
    { key: 'Production', icon: 'factory' },
    { key: 'Community',  icon: 'message' },
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
      text: "Hi Admin — ask me anything about your business. I can analyse sales, orders, creators, products, templates, production, and community. Try one of the prompts below.",
    },
  ]);

  readonly input = signal('');
  readonly thinking = signal(false);

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const el = this.scrollRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  setInput(v: string): void { this.input.set(v); }

  /** Triggered by clicking a category — fills input and sends "Overall report for {category}". */
  sendCategoryReport(categoryKey: string): void {
    this.send(`Overall report for ${categoryKey}`);
  }

  /** Triggered by clicking a suggested prompt. */
  sendSuggestion(prompt: string): void {
    this.send(prompt);
  }

  send(text?: string): void {
    const value = (text ?? this.input()).trim();
    if (!value || this.thinking()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'admin',
      text: value,
    };
    this.messages.update((m) => [...m, userMsg]);
    this.input.set('');
    this.thinking.set(true);

    setTimeout(() => {
      const aiReply = this.generateReport(value);
      this.thinking.set(false);
      this.messages.update((m) => [...m, { id: `a-${Date.now()}`, role: 'ai', ...aiReply }]);
    }, 850);
  }

  /** Returns a mock report based on the prompt keywords. */
  private generateReport(question: string): Partial<ChatMessage> {
    const q = question.toLowerCase();

    if (q.includes('sales') && (q.includes('drop') || q.includes('down'))) {
      return {
        reportTitle: 'Sales decline — May vs. April 2026',
        reportSummary: "Net revenue fell 23.4% month-over-month. The decline is concentrated in the Outerwear and Footwear lines, driven by a slowdown in new user registrations and three delayed production jobs at the Porto atelier.",
        reportMetrics: [
          { label: 'Revenue', value: '$262,440', trend: 'down', delta: '-23.4%' },
          { label: 'New users', value: '1,084', trend: 'down', delta: '-40.1%' },
          { label: 'Delayed orders', value: '3', trend: 'down', delta: '+3' },
          { label: 'Refund rate', value: '2.1%', trend: 'up', delta: '+0.6 pts' },
        ],
        reportInsights: [
          { kind: 'negative', text: 'New user signups fell 40% after the May 14 paid-acquisition pause.' },
          { kind: 'negative', text: 'Three Porto production jobs slipped by 6–9 days, blocking $48K in orders.' },
          { kind: 'neutral',  text: 'Returning customer spend held steady at $128 AOV.' },
        ],
        reportRecommendations: [
          'Restart paid acquisition on Instagram + Pinterest with a $35K budget cap.',
          "Re-route delayed Porto jobs to the Barcelona partner atelier.",
          "Push 'Atelier Member' coupon to dormant accounts (est. +$22K).",
        ],
      };
    }

    if (q.includes('top creator')) {
      return {
        reportTitle: 'Top creators — Week of June 1, 2026',
        reportSummary: 'Five creators drove 38% of community-published templates and 41% of design-to-purchase conversions this week.',
        reportMetrics: [
          { label: 'Templates published', value: '412', trend: 'up', delta: '+18%' },
          { label: 'Design conversions', value: '9.4%', trend: 'up', delta: '+1.2 pts' },
          { label: 'Avg. creator rating', value: '4.82', trend: 'up', delta: '+0.06' },
          { label: 'Featured drops', value: '7', trend: 'flat' },
        ],
        reportInsights: [
          { kind: 'positive', text: 'Aiko Tanaka — 38 templates, avg. rating 4.94, $24K influenced revenue.' },
          { kind: 'positive', text: "Marco Silva — 22 templates featured in 'Atelier Picks' carousel." },
          { kind: 'positive', text: 'Lena Park — highest engagement (+62% comments WoW).' },
        ],
        reportRecommendations: [
          "Offer top 5 creators a co-branded SS '26 capsule.",
          "Promote Aiko Tanaka to 'Master Creator' tier with revenue share.",
        ],
      };
    }

    if (q.includes('return')) {
      return {
        reportTitle: 'Most returned products — Last 30 days',
        reportSummary: 'Returns are concentrated in three SKUs, totalling 62% of all returned items. Root cause: inconsistent sizing on the new heavyweight cotton.',
        reportMetrics: [
          { label: 'Return rate', value: '3.8%', trend: 'down', delta: '+0.9 pts' },
          { label: 'Total returns', value: '184', trend: 'down', delta: '+44' },
          { label: 'Refund value', value: '$28,420', trend: 'down' },
          { label: 'Top reason', value: 'Sizing', trend: 'flat' },
        ],
        reportInsights: [
          { kind: 'negative', text: "Onyx Studio Tee (heavyweight) — 64 returns, 'runs small'." },
          { kind: 'negative', text: "Cream Atelier Hoodie — 41 returns, 'sleeves long'." },
          { kind: 'neutral',  text: "Coral Mark Cap — 23 returns, mostly 'changed mind'." },
        ],
        reportRecommendations: [
          'Update size guide with garment-flat measurements for heavyweight cotton.',
          'Add a fit-finder quiz on PDPs for the affected SKUs.',
        ],
      };
    }

    if (q.includes('production')) {
      return {
        reportTitle: 'Production overview — June 2026',
        reportSummary: 'Atelier network operating at 87% capacity. Lisbon and Barcelona on track; Porto running 4 days behind due to fabric shortage.',
        reportMetrics: [
          { label: 'Capacity used', value: '87%', trend: 'up', delta: '+5 pts' },
          { label: 'On-time rate', value: '92.1%', trend: 'down', delta: '-3.2 pts' },
          { label: 'Avg. lead time', value: '11 days', trend: 'down', delta: '+2 days' },
          { label: 'QC pass rate', value: '98.4%', trend: 'up', delta: '+0.4 pts' },
        ],
        reportInsights: [
          { kind: 'negative', text: 'Porto atelier blocked on 220gsm cotton — restock ETA June 9.' },
          { kind: 'positive', text: 'Lisbon throughput up 14% after new cutter onboarded.' },
          { kind: 'neutral',  text: "Barcelona absorbing 30% of Porto's overflow this week." },
        ],
        reportRecommendations: [
          'Lock in secondary fabric supplier for Porto.',
          'Increase Lisbon shift coverage on Tue/Thu evenings.',
        ],
      };
    }

    // Default: revenue overview
    return {
      reportTitle: 'Revenue overview — June 2026 MTD',
      reportSummary: 'Revenue is pacing 12.4% ahead of plan, led by the Atelier capsule and improved checkout conversion on mobile.',
      reportMetrics: [
        { label: 'Revenue MTD', value: '$342,180', trend: 'up', delta: '+18.4%' },
        { label: 'Orders', value: '2,592', trend: 'up', delta: '+12.1%' },
        { label: 'AOV', value: '$132', trend: 'up', delta: '+$6' },
        { label: 'Conversion', value: '4.82%', trend: 'up', delta: '+0.6 pts' },
      ],
      reportInsights: [
        { kind: 'positive', text: 'Mobile checkout conversion up 1.1 pts after Apple Pay rollout.' },
        { kind: 'positive', text: 'Atelier capsule sold through 78% of inventory in 9 days.' },
        { kind: 'neutral',  text: 'Email contributes 22% of revenue, stable WoW.' },
      ],
      reportRecommendations: [
        'Restock Atelier capsule core SKUs by June 14.',
        'Test free shipping threshold at $95 to lift AOV further.',
      ],
    };
  }
}
