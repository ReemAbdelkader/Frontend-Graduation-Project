import { Component, signal } from '@angular/core';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { PostDetailModalComponent } from '../../shared/components/post-detail-modal/post-detail-modal.component';
import {
  communityPosts,
  CommunityPost,
  topCreators,
  trendingTags,
} from '../../core/data/wearly-data';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [AppNavComponent, PostDetailModalComponent],
  templateUrl: './community.component.html',
  styleUrl: './community.component.scss',
})
export class CommunityComponent {
  readonly posts = communityPosts;
  readonly creators = topCreators;
  readonly trending = trendingTags;

  readonly openPost = signal<CommunityPost | null>(null);

  openDetail(p: CommunityPost): void {
    this.openPost.set(p);
  }

  closeDetail(): void {
    this.openPost.set(null);
  }
}
