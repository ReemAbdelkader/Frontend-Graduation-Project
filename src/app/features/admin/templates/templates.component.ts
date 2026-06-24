import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { mockTemplates, MockTemplate } from '../../../core/data/admin-mock-data';

@Component({
  selector: 'app-admin-templates',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss',
})
export class TemplatesComponent {
  readonly templates = signal<MockTemplate[]>(mockTemplates);
  readonly query = signal('');

  // View-details modal state
  readonly viewing = signal<MockTemplate | null>(null);

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = this.templates();
    if (!q) return list;
    return list.filter((t) =>
      `${t.name} ${t.creatorName} ${t.categoryName}`.toLowerCase().includes(q),
    );
  });

  setQuery(v: string): void { this.query.set(v); }

  viewDetails(t: MockTemplate): void {
    this.viewing.set(t);
  }

  closeDetails(): void {
    this.viewing.set(null);
  }
}
