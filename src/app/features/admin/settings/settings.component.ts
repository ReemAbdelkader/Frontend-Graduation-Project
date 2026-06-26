import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private toast = inject(ToastService);

  readonly orgName = signal('Atelier AI');
  readonly supportEmail = signal('hello@atelier.ai');
  readonly allowSignups = signal(true);
  readonly maintenance = signal(false);

  saveChanges(): void {
    this.toast.success('Settings saved.');
  }

  toggleSignups(): void {
    this.allowSignups.update((v) => !v);
  }

  toggleMaintenance(): void {
    this.maintenance.update((v) => !v);
  }
}
