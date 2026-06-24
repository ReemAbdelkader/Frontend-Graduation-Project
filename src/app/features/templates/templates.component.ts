import { Component, signal, computed } from '@angular/core';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { templates } from '../../core/data/wearly-data';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [AppNavComponent],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss',
})
export class TemplatesComponent {
  readonly allTemplates = templates;

  readonly tab = signal<'ai' | 'community'>('ai');

  readonly filtered = computed(() => {
    const t = this.tab();
    return this.allTemplates.filter((tmpl) =>
      t === 'ai' ? tmpl.author === 'Wearly AI' : tmpl.author !== 'Wearly AI'
    );
  });

  setTab(t: 'ai' | 'community'): void {
    this.tab.set(t);
  }

  bgClass(i: number): string {
    const idx = i % 4;
    return `bg-${idx}`;
  }
}
