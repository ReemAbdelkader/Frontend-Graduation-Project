import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-community-interaction-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="action-btn heart"
      type="button"
      (click)="$event.stopPropagation(); like.emit()"
      [class.active]="isLiked"
      [disabled]="liking"
      aria-label="Like"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
      </svg>
      <span>{{ likesCount }}</span>
    </button>

    <button
      class="action-btn comment"
      type="button"
      (click)="$event.stopPropagation(); comment.emit()"
      aria-label="Comments"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span>{{ commentsCount }}</span>
    </button>

    <button
      class="action-btn save"
      type="button"
      (click)="$event.stopPropagation(); save.emit()"
      [class.active]="isSaved"
      [disabled]="saving"
      aria-label="Save"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      </svg>
      <span>{{ isSaved ? 'Saved' : 'Save' }}</span>
    </button>

    <button
      class="action-btn report"
      type="button"
      (click)="$event.stopPropagation(); report.emit()"
      aria-label="Report"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
      <span>Report</span>
    </button>
  `,
  styles: [
    `:host {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      border: none;
      background: transparent;
      color: var(--muted-foreground);
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
    }

    .action-btn.heart:hover,
    .action-btn.comment:hover,
    .action-btn.save:hover,
    .action-btn.report:hover {
      color: var(--accent);
    }

    .action-btn.active {
      font-weight: 600;
    }

    .action-btn.heart.active {
      color: var(--accent);
    }
    .action-btn.heart.active svg {
      fill: var(--accent);
    }

    .action-btn.save.active {
      color: var(--primary);
    }
    .action-btn.save.active svg {
      fill: var(--primary);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    svg {
      display: block;
      width: 16px;
      height: 16px;
    }
    `,
  ],
})
export class CommunityInteractionRowComponent {
  @Input() likesCount = 0;
  @Input() commentsCount = 0;
  @Input() isLiked = false;
  @Input() isSaved = false;
  @Input() liking = false;
  @Input() saving = false;

  @Output() like = new EventEmitter<void>();
  @Output() comment = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() report = new EventEmitter<void>();
}
