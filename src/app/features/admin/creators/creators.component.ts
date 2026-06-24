import { Component, signal, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

interface Creator {
  id: string;
  name: string;
  email: string;
  sales: number;
  orders: number;
  rating: number;
  featured: boolean;
}

@Component({
  selector: 'app-admin-creators',
  standalone: true,
  imports: [],
  templateUrl: './creators.component.html',
  styleUrl: './creators.component.scss',
})
export class CreatorsComponent {
  private toast = inject(ToastService);

  readonly creators = signal<Creator[]>([
    { id: 'cr1', name: 'Elena Asher',   email: 'elena@atelier.com',  sales: 2384, orders: 14, rating: 4.8, featured: true  },
    { id: 'cr2', name: 'Aiko Tanaka',   email: 'aiko.t@wearly.co',   sales: 5120, orders: 31, rating: 4.8, featured: true  },
    { id: 'cr3', name: 'Marco Silva',   email: 'marco@silva.io',     sales: 3940, orders: 22, rating: 4.8, featured: false },
  ]);

  feature(c: Creator): void {
    this.creators.update((s) =>
      s.map((x) => (x.id === c.id ? { ...x, featured: !x.featured } : x)),
    );
    this.toast.success(`${c.name} ${c.featured ? 'unfeatured' : 'featured'}.`);
  }

  approveReward(c: Creator): void {
    this.toast.success(`Reward approved for ${c.name}.`);
  }

  initials(name: string): string {
    return name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  formatCurrency(n: number): string {
    return '$' + n.toLocaleString();
  }
}
