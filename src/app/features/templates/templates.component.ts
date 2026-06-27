import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, map, of, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import {
  TemplateDetailDto,
  TemplateDto,
  TemplatesApiService,
} from '../../core/services/templates-api.service';
import { AuthService } from '../../core/services/auth.service';

type TabType = 'public' | 'mine';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, AppNavComponent],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss',
})
export class TemplatesComponent {
  private readonly api = inject(TemplatesApiService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly templates = signal<TemplateDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pageNumber = signal(1);
  readonly pageSize = 12;
  readonly totalPages = signal(0);
  readonly totalCount = signal(0);
  readonly categoryNames = signal<Record<string, string>>({});
  readonly creatorNames = signal<Record<string, string>>({});
  readonly selectedTemplate = signal<TemplateDetailDto | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly activeTab = signal<TabType>('public');

  readonly isLoggedIn = this.auth.isLoggedIn;

  readonly hasPreviousPage = computed(() => this.pageNumber() > 1);
  readonly hasNextPage = computed(() => this.pageNumber() < this.totalPages());

  constructor() {
    this.loadCategories();
    this.loadPage(1);
  }

  switchTab(tab: TabType): void {
    if (tab === this.activeTab()) return;
    this.activeTab.set(tab);
    this.pageNumber.set(1);
    this.totalPages.set(0);
    this.totalCount.set(0);
    this.templates.set([]);
    this.loadPage(1);
  }

  loadPage(pageNumber: number): void {
    if (pageNumber < 1) return;

    const totalPages = this.totalPages();
    if (totalPages > 0 && pageNumber > totalPages) return;

    this.loading.set(true);
    this.error.set(null);

    const fetch$ = this.activeTab() === 'mine'
      ? this.api.getMyTemplates(pageNumber, this.pageSize)
      : this.api.getPublicTemplates(pageNumber, this.pageSize);

    fetch$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.templates.set(result.data);
          this.pageNumber.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
          this.loadCreatorNames(result.data);
        },
        error: () => {
          this.templates.set([]);
          this.loading.set(false);
          this.error.set('Templates are unavailable right now.');
        },
      });
  }

  openTemplate(id: string): void {
    this.selectedTemplate.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);

    this.api
      .getTemplate(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (template) => {
          this.selectedTemplate.set(template);
          this.detailLoading.set(false);
          this.loadCreatorNames([template]);
        },
        error: () => {
          this.detailLoading.set(false);
          this.detailError.set('Template details are unavailable right now.');
        },
      });
  }

  closeTemplate(): void {
    this.selectedTemplate.set(null);
    this.detailError.set(null);
    this.detailLoading.set(false);
  }

  previewUrl(template: TemplateDto): string {
    return this.api.resolvePreviewUrl(template.previewImageURL);
  }

  styleTags(template: TemplateDto): string[] {
    return (template.styleTags ?? '')
      .split(/[,;|·]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  categoryName(categoryId: string): string | null {
    return this.categoryNames()[categoryId] ?? null;
  }

  creatorName(creatorUserId: string): string | null {
    return this.creatorNames()[creatorUserId] ?? null;
  }

  bgClass(i: number): string {
    const idx = i % 4;
    return `bg-${idx}`;
  }

  private loadCategories(): void {
    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categoryNames.set(
            categories.reduce<Record<string, string>>((acc, category) => {
              acc[category.id] = category.name;
              return acc;
            }, {})
          );
        },
        error: () => this.categoryNames.set({}),
      });
  }

  private loadCreatorNames(templates: TemplateDto[]): void {
    const knownCreators = this.creatorNames();
    const creatorIds = Array.from(new Set(templates.map((template) => template.creatorUserId)))
      .filter((id) => id && knownCreators[id] === undefined);

    if (creatorIds.length === 0) return;

    forkJoin(
      creatorIds.map((id) =>
        this.api.getProfile(id).pipe(
          map((profile) => [id, profile.name || profile.userName] as const),
          catchError(() => of([id, ''] as const))
        )
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((entries) => {
        this.creatorNames.update((current) => {
          const next = { ...current };
          for (const [id, name] of entries) {
            next[id] = name;
          }
          return next;
        });
      });
  }
}