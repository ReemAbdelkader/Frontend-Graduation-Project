import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminApiService, TemplateDto } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-templates',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss',
})
export class TemplatesComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  readonly templates = signal<TemplateDto[]>([]);
  readonly query = signal('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly viewing = signal<TemplateDto | null>(null);

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = this.templates();
    if (!q) return list;
    return list.filter((t) => t.name.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminApi.getTemplates(1, 100).subscribe({
      next: (result) => {
        this.templates.set(result.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load templates.');
        this.loading.set(false);
      },
    });
  }

  setQuery(v: string): void { this.query.set(v); }

  viewDetails(t: TemplateDto): void {
    this.viewing.set(t);
  }

  closeDetails(): void {
    this.viewing.set(null);
  }

  imageUrl(url?: string | null): string {
    return this.adminApi.resolveAssetUrl(url);
  }

  statusLabel(t: TemplateDto): string {
    return t.isPublic ? 'Published' : 'Private';
  }

  statusClass(t: TemplateDto): string {
    return t.isPublic ? 'status-published' : 'status-draft';
  }
}
