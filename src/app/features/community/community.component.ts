import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { CommunityInteractionRowComponent } from '../../shared/components/community-interaction-row/community-interaction-row.component';
import { PostDetailModalComponent } from '../../shared/components/post-detail-modal/post-detail-modal.component';
import { TemplatesApiService } from '../../core/services/templates-api.service';
import {
  CommunityApiService,
  CommunityCommentDto,
  CommunityFeedItemDto,
  CommunityTopCreatorDto,
} from '../../core/services/community-api.service';
import { CommunityPost } from '../../core/data/wearly-data';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, AppNavComponent, PostDetailModalComponent, CommunityInteractionRowComponent],
  templateUrl: './community.component.html',
  styleUrl: './community.component.scss',
})
export class CommunityComponent {
  readonly api = inject(CommunityApiService);
  readonly templatesApi = inject(TemplatesApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly creators = signal<CommunityTopCreatorDto[]>([]);

  readonly posts = signal<CommunityFeedItemDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedFilter = signal<'default' | 'new'>('default');
  readonly pageNumber = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);
  readonly creatorsLoading = signal(false);
  readonly creatorsError = signal<string | null>(null);
  readonly openPost = signal<CommunityFeedItemDto | null>(null);
  readonly openPostView = computed(() =>
    this.openPost() ? this.toCommunityPost(this.openPost()!) : null
  );
  readonly selectedPostComments = signal<CommunityCommentDto[]>([]);
  readonly commentsLoading = signal(false);
  readonly commentsError = signal<string | null>(null);
  readonly postingComment = signal(false);
  readonly deletingCommentId = signal<string | null>(null);
  readonly reportLoading = signal(false);
  readonly reportSuccess = signal(false);
  readonly likingPostId = signal<string | null>(null);
  readonly savingPostId = signal<string | null>(null);
  readonly savedPostIds = signal<string[]>([]);
  readonly likedPostIds = signal<string[]>([]);
  readonly reportDraft = signal('');
  readonly commentDraft = signal('');

  readonly hasPreviousPage = computed(() => this.pageNumber() > 1);
  readonly hasNextPage = computed(() => this.pageNumber() < this.totalPages());
  readonly isEmpty = computed(
    () => !this.loading() && !this.error() && this.posts().length === 0
  );

  private readonly toast = inject(ToastService);

  constructor() {
    this.loadFeed();
    this.loadTopCreators();
  }

  changeFilter(filter: 'default' | 'new'): void {
    if (this.selectedFilter() === filter) {
      return;
    }

    this.selectedFilter.set(filter);
    this.pageNumber.set(1);
    this.loadFeed();
  }

  previousPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }

    this.pageNumber.update((value) => value - 1);
    this.loadFeed();
  }

  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.pageNumber.update((value) => value + 1);
    this.loadFeed();
  }

  openDetail(post: CommunityFeedItemDto): void {
    this.openPost.set(post);
    this.reportSuccess.set(false);
    this.reportDraft.set('');
    this.commentDraft.set('');
    this.loadComments(post.id);
    this.loadTemplateDetail(post);
  }

  closeDetail(): void {
    this.openPost.set(null);
    this.selectedPostComments.set([]);
    this.commentsError.set(null);
    this.postingComment.set(false);
    this.deletingCommentId.set(null);
    this.reportLoading.set(false);
    this.reportSuccess.set(false);
  }

  toCommunityPost(post: CommunityFeedItemDto): CommunityPost {
    return {
      id: post.id,
      title: post.name,
      author: post.creatorName,
      avatar: this.creatorInitials(post.creatorName),
      rating: post.averageRating,
      ratings: post.likesCount,
      comments: post.commentCount,
      uses: post.remixesCount,
      image: this.api.resolvePreviewUrl(post.previewImageURL),
    };
  }

  trackByPost(_index: number, post: CommunityFeedItemDto): string {
    return post.id;
  }

  openComments(event: Event | undefined, post: CommunityFeedItemDto): void {
    event?.stopPropagation();
    this.openDetail(post);
  }

  trackByCreator(_index: number, creator: CommunityTopCreatorDto): string {
    return creator.userId;
  }

  trackByTag(_index: number, tag: { tag: string }): string {
    return tag.tag;
  }

  trackByComment(_index: number, comment: CommunityCommentDto): string {
    return comment.id;
  }

  isSaved(post: CommunityFeedItemDto): boolean {
    // Prefer explicit saved ids initialized from feed; fall back to post flag when present
    return this.savedPostIds().includes(post.id) || !!post.savedByCurrentUser;
  }

  isLiked(post: CommunityFeedItemDto): boolean {
    return this.likedPostIds().includes(post.id) || !!post.likedByCurrentUser;
  }

  likePost(event: Event | undefined, post: CommunityFeedItemDto): void {
    event?.stopPropagation();
    if (this.likingPostId() === post.id) {
      return;
    }

    const currentlyLiked = this.isLiked(post);

    // Optimistic UI update
    this.likingPostId.set(post.id);
    if (currentlyLiked) {
      // unlike
      this.likedPostIds.update((ids) => ids.filter((id) => id !== post.id));
      this.posts.update((items) =>
        items.map((item) =>
          item.id === post.id ? { ...item, likesCount: Math.max(0, item.likesCount - 1), likedByCurrentUser: false } : item
        )
      );
      if (this.openPost()?.id === post.id) {
        this.openPost.update((current) =>
          current ? { ...current, likesCount: Math.max(0, current.likesCount - 1), likedByCurrentUser: false } : current
        );
      }
    } else {
      // like
      this.likedPostIds.update((ids) => (ids.includes(post.id) ? ids : [...ids, post.id]));
      this.posts.update((items) =>
        items.map((item) =>
          item.id === post.id ? { ...item, likesCount: item.likesCount + 1, likedByCurrentUser: true } : item
        )
      );
      if (this.openPost()?.id === post.id) {
        this.openPost.update((current) =>
          current ? { ...current, likesCount: current.likesCount + 1, likedByCurrentUser: true } : current
        );
      }
    }

    // Call API; backend is authoritative. On error, revert optimistic change.
    this.api
      .likeTemplate(post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          this.toast.success(currentlyLiked ? 'Template unliked.' : 'Template liked.');
          // Sync with exact backend state
          this.posts.update((items) =>
            items.map((item) =>
              item.id === post.id
                ? { ...item, likesCount: status.count, likedByCurrentUser: status.liked }
                : item
            )
          );
          if (this.openPost()?.id === post.id) {
            this.openPost.update((current) =>
              current
                ? { ...current, likesCount: status.count, likedByCurrentUser: status.liked }
                : current
            );
          }
          if (status.liked) {
            this.likedPostIds.update((ids) => (ids.includes(post.id) ? ids : [...ids, post.id]));
          } else {
            this.likedPostIds.update((ids) => ids.filter((id) => id !== post.id));
          }
        },
        error: (err) => {
          // revert
          if (currentlyLiked) {
            this.likedPostIds.update((ids) => (ids.includes(post.id) ? ids : [...ids, post.id]));
            this.posts.update((items) =>
              items.map((item) =>
                item.id === post.id ? { ...item, likesCount: item.likesCount + 1, likedByCurrentUser: true } : item
              )
            );
            if (this.openPost()?.id === post.id) {
              this.openPost.update((current) =>
                current ? { ...current, likesCount: current.likesCount + 1, likedByCurrentUser: true } : current
              );
            }
          } else {
            this.likedPostIds.update((ids) => ids.filter((id) => id !== post.id));
            this.posts.update((items) =>
              items.map((item) =>
                item.id === post.id ? { ...item, likesCount: Math.max(0, item.likesCount - 1), likedByCurrentUser: false } : item
              )
            );
            if (this.openPost()?.id === post.id) {
              this.openPost.update((current) =>
                current ? { ...current, likesCount: Math.max(0, current.likesCount - 1), likedByCurrentUser: false } : current
              );
            }
          }
          this.toast.error(err.message ?? 'Unable to like/unlike template.');
        },
        complete: () => {
          this.likingPostId.set(null);
        },
      });
  }

  savePost(event: Event | undefined, post: CommunityFeedItemDto): void {
    event?.stopPropagation();
    if (this.savingPostId() === post.id) {
      return;
    }

    const currentlySaved = this.isSaved(post);

    // Optimistic toggle
    this.savingPostId.set(post.id);
    if (currentlySaved) {
      this.savedPostIds.update((ids) => ids.filter((id) => id !== post.id));
      this.posts.update((items) =>
        items.map((item) =>
          item.id === post.id ? { ...item, savedByCurrentUser: false } : item
        )
      );
      if (this.openPost()?.id === post.id) {
        this.openPost.update((current) =>
          current ? { ...current, savedByCurrentUser: false } : current
        );
      }
    } else {
      this.savedPostIds.update((ids) => (ids.includes(post.id) ? ids : [...ids, post.id]));
      this.posts.update((items) =>
        items.map((item) =>
          item.id === post.id ? { ...item, savedByCurrentUser: true } : item
        )
      );
      if (this.openPost()?.id === post.id) {
        this.openPost.update((current) =>
          current ? { ...current, savedByCurrentUser: true } : current
        );
      }
    }

    this.api
      .saveTemplate(post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          this.toast.success(currentlySaved ? 'Template unsaved.' : 'Template saved.');
          // Sync with exact backend state
          this.posts.update((items) =>
            items.map((item) =>
              item.id === post.id ? { ...item, savedByCurrentUser: status.saved } : item
            )
          );
          if (this.openPost()?.id === post.id) {
            this.openPost.update((current) =>
              current ? { ...current, savedByCurrentUser: status.saved } : current
            );
          }
          if (status.saved) {
            this.savedPostIds.update((ids) => (ids.includes(post.id) ? ids : [...ids, post.id]));
          } else {
            this.savedPostIds.update((ids) => ids.filter((id) => id !== post.id));
          }
        },
        error: (err) => {
          // revert
          if (currentlySaved) {
            this.savedPostIds.update((ids) => (ids.includes(post.id) ? ids : [...ids, post.id]));
            this.posts.update((items) =>
              items.map((item) =>
                item.id === post.id ? { ...item, savedByCurrentUser: true } : item
              )
            );
            if (this.openPost()?.id === post.id) {
              this.openPost.update((current) =>
                current ? { ...current, savedByCurrentUser: true } : current
              );
            }
          } else {
            this.savedPostIds.update((ids) => ids.filter((id) => id !== post.id));
            this.posts.update((items) =>
              items.map((item) =>
                item.id === post.id ? { ...item, savedByCurrentUser: false } : item
              )
            );
            if (this.openPost()?.id === post.id) {
              this.openPost.update((current) =>
                current ? { ...current, savedByCurrentUser: false } : current
              );
            }
          }
          this.toast.error(err.message ?? 'Unable to toggle save.');
        },
        complete: () => {
          this.savingPostId.set(null);
        },
      });
  }

  loadFeed(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .getCommunityFeed(this.pageNumber(), this.pageSize(), this.selectedFilter())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
            this.posts.set(result.data);
            // Initialize saved/liked state from backend flags if provided
            const savedIds = result.data.filter((d) => !!d.savedByCurrentUser).map((d) => d.id);
            const likedIds = result.data.filter((d) => !!d.likedByCurrentUser).map((d) => d.id);
            this.savedPostIds.set(savedIds);
            this.likedPostIds.set(likedIds);
          this.totalPages.set(result.totalPages);
          this.totalCount.set(result.totalCount);
          this.pageNumber.set(result.currentPage);
          this.loading.set(false);
        },
        error: () => {
          this.posts.set([]);
          this.totalPages.set(1);
          this.totalCount.set(0);
          this.loading.set(false);
          this.error.set('Unable to load community feed. Please try again later.');
        },
      });
  }

  loadComments(templateId: string): void {
    this.selectedPostComments.set([]);
    this.commentsLoading.set(true);
    this.commentsError.set(null);

    this.api
      .getTemplateComments(templateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          this.selectedPostComments.set(comments);
          this.commentsLoading.set(false);
        },
        error: () => {
          this.commentsLoading.set(false);
          this.commentsError.set('Unable to load comments. Please try again later.');
        },
      });
  }

  private loadTemplateDetail(post: CommunityFeedItemDto): void {
    this.templatesApi
      .getTemplate(post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          const updated: CommunityFeedItemDto = {
            ...post,
            likesCount: detail.likesCount,
            remixesCount: detail.remixesCount,
            averageRating: detail.averageRating,
            createdAt: detail.createdAt,
            savedByCurrentUser: detail.savedByCurrentUser ?? post.savedByCurrentUser,
            likedByCurrentUser: detail.likedByCurrentUser ?? post.likedByCurrentUser,
            commentCount: detail.commentCount ?? post.commentCount
          };
          this.openPost.set(updated);
          if (updated.savedByCurrentUser) {
            this.savedPostIds.update((ids) => (ids.includes(updated.id) ? ids : [...ids, updated.id]));
          }
          if (updated.likedByCurrentUser) {
            this.likedPostIds.update((ids) => (ids.includes(updated.id) ? ids : [...ids, updated.id]));
          }
        },
        error: () => {
          // Keep feed data if detail load fails
        },
      });
  }

  postComment(content: string): void {
    const post = this.openPost();
    if (!post) {
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    this.postingComment.set(true);
    this.api
      .postTemplateComment(post.id, trimmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newComment) => {
          this.commentDraft.set('');
          this.selectedPostComments.update((comments) => [newComment, ...comments]);
          this.updateCommentCount(post.id, 1);
          this.toast.success('Comment added successfully.');
        },
        error: (err) => {
          this.toast.error(err.message ?? 'Unable to post comment.');
        },
        complete: () => {
          this.postingComment.set(false);
        },
      });
  }

  openReport(post: CommunityFeedItemDto): void {
    this.openDetail(post);
    setTimeout(() => {
      const reportTextarea = document.querySelector('.report-section textarea') as HTMLTextAreaElement;
      reportTextarea?.focus();
      reportTextarea?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }

  deleteComment(commentId: string): void {
    const post = this.openPost();
    if (!post) {
      return;
    }

    this.deletingCommentId.set(commentId);
    this.api
      .deleteTemplateComment(post.id, commentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.selectedPostComments.update((comments) =>
            comments.filter((comment) => comment.id !== commentId)
          );
          this.updateCommentCount(post.id, -1);
          this.toast.success('Comment deleted.');
        },
        error: (err) => {
          this.toast.error(err.message ?? 'Unable to delete comment.');
        },
        complete: () => {
          this.deletingCommentId.set(null);
        },
      });
  }

  reportTemplate(reason: string): void {
    const post = this.openPost();
    if (!post) {
      return;
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      this.toast.error('Please enter a report reason.');
      return;
    }

    this.reportLoading.set(true);
    this.reportSuccess.set(false);
    this.api
      .reportTemplate(post.id, trimmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reportDraft.set('');
          this.reportSuccess.set(true);
          this.toast.success('Report submitted successfully.');
        },
        error: (err) => {
          this.toast.error(err.message ?? 'Unable to report template.');
        },
        complete: () => {
          this.reportLoading.set(false);
        },
      });
  }

  private updateCommentCount(templateId: string, delta: number): void {
    this.posts.update((items) =>
      items.map((item) =>
        item.id === templateId
          ? { ...item, commentCount: item.commentCount + delta }
          : item
      )
    );

    if (this.openPost()?.id === templateId) {
      this.openPost.update((current) =>
        current ? { ...current, commentCount: current.commentCount + delta } : current
      );
    }
  }

  loadTopCreators(): void {
    this.creatorsLoading.set(true);
    this.creatorsError.set(null);

    this.api
      .getTopCreators(5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (creators) => {
          this.creators.set(creators);
          this.creatorsLoading.set(false);
        },
        error: () => {
          this.creators.set([]);
          this.creatorsLoading.set(false);
          this.creatorsError.set('Unable to load top creators. Please try again later.');
        },
      });
  }

  creatorInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
