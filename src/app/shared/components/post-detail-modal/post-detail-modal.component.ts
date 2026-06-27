import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommunityCommentDto } from '../../../core/services/community-api.service';
import { CommunityPost } from '../../../core/data/wearly-data';
import { CommunityInteractionRowComponent } from '../community-interaction-row/community-interaction-row.component';

@Component({
  selector: 'app-post-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CommunityInteractionRowComponent],
  templateUrl: './post-detail-modal.component.html',
  styleUrl: './post-detail-modal.component.scss',
})
export class PostDetailModalComponent {
  @Input({ required: true }) post!: CommunityPost;
  @Input() comments: CommunityCommentDto[] = [];
  @Input() commentsLoading = false;
  @Input() commentsError: string | null = null;
  @Input() postingComment = false;
  @Input() deletingCommentId: string | null = null;
  @Input() reportLoading = false;
  @Input() reportSuccess = false;
  @Input() isSaved = false;
  @Input() isLiking = false;
  @Input() isLiked = false;
  @Input() isSaving = false;
  @Input() commentDraft = '';
  @Input() reportDraft = '';

  @ViewChild('commentInput', { read: ElementRef, static: false }) commentInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('reportInput', { read: ElementRef, static: false }) reportInput?: ElementRef<HTMLTextAreaElement>;

  @Output() close = new EventEmitter<void>();
  @Output() like = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() postComment = new EventEmitter<string>();
  @Output() deleteComment = new EventEmitter<string>();
  @Output() report = new EventEmitter<string>();
  @Output() commentDraftChange = new EventEmitter<string>();
  @Output() reportDraftChange = new EventEmitter<string>();

  focusCommentInput(): void {
    this.commentInput?.nativeElement?.focus();
  }

  focusReportInput(): void {
    this.reportInput?.nativeElement?.focus();
    this.reportInput?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }

  trackByComment(_index: number, comment: CommunityCommentDto): string {
    return comment.id;
  }
}
