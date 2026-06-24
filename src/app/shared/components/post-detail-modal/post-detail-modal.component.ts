import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommunityPost } from '../../../core/data/wearly-data';

@Component({
  selector: 'app-post-detail-modal',
  standalone: true,
  templateUrl: './post-detail-modal.component.html',
  styleUrl: './post-detail-modal.component.scss',
})
export class PostDetailModalComponent {
  @Input({ required: true }) post!: CommunityPost;
  @Output() close = new EventEmitter<void>();
}
