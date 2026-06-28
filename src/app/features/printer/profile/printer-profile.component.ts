import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  PRINTER_FABRIC_OPTIONS,
  PRINTER_PRINT_METHOD_OPTIONS,
  PrinterService,
} from '../../../core/services/printer.service';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-printer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './printer-profile.component.html',
  styleUrl: './printer-profile.component.scss',
})
export class PrinterProfileComponent implements OnInit {
  private readonly printerService = inject(PrinterService);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly name = signal('');
  readonly email = signal('');
  readonly address = signal('');
  readonly supportedFabrics = signal(0);
  readonly supportedPrintMethods = signal(0);
  readonly hasExistingProfile = signal(false);

  readonly fabricOptions = PRINTER_FABRIC_OPTIONS;
  readonly methodOptions = PRINTER_PRINT_METHOD_OPTIONS;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    const authUser = this.authService.user();

    this.name.set(authUser?.name ?? '');
    this.email.set(authUser?.email ?? '');

    forkJoin({
      account: this.profileService.getProfile().pipe(catchError(() => of(null))),
      printer: this.printerService.getMyPrinterProfile().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ account, printer }) => {
        if (account) {
          this.name.set(account.name || authUser?.name || '');
          this.email.set(account.email || authUser?.email || '');
          this.address.set(account.location ?? '');
        }

        if (printer) {
          this.hasExistingProfile.set(true);
          this.supportedFabrics.set(printer.supportedFabrics ?? 0);
          this.supportedPrintMethods.set(printer.supportedPrintMethods ?? 0);
        } else {
          this.hasExistingProfile.set(false);
        }

        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Unable to load printer profile.');
        this.loading.set(false);
      },
    });
  }

  isFabricSelected(value: number): boolean {
    return this.printerService.isFlagSelected(this.supportedFabrics(), value);
  }

  isMethodSelected(value: number): boolean {
    return this.printerService.isFlagSelected(this.supportedPrintMethods(), value);
  }

  toggleFabric(value: number, checked: boolean): void {
    this.supportedFabrics.update((mask) => this.printerService.toggleFlag(mask, value, checked));
  }

  toggleMethod(value: number, checked: boolean): void {
    this.supportedPrintMethods.update((mask) => this.printerService.toggleFlag(mask, value, checked));
  }

  saveProfile(): void {
    const supportedFabrics = this.supportedFabrics();
    const supportedPrintMethods = this.supportedPrintMethods();

    if (!supportedFabrics || !supportedPrintMethods) {
      this.toast.error('Select at least one fabric and one print method.');
      return;
    }

    this.saving.set(true);

    this.printerService.savePrinterProfile({ supportedFabrics, supportedPrintMethods }).subscribe({
      next: (result) => {
        if (result.success) {
          this.toast.success(result.message || 'Printer profile saved.');
          this.loadProfile();
        } else {
          const message = result.message || 'Failed to save printer profile.';
          this.toast.error(
            this.hasExistingProfile() && /exist|already|duplicate/i.test(message)
              ? 'You already have a printer profile. The backend currently only supports creating it once.'
              : message,
          );
        }
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.message || 'Failed to save printer profile.');
        this.saving.set(false);
      },
    });
  }
}
