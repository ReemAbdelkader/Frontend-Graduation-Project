import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mockPrinterProfile, printerFabricOptions, printerMethodOptions } from '../../printer/printer-mock-data';

@Component({
  selector: 'app-printer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './printer-profile.component.html',
  styleUrl: './printer-profile.component.scss',
})
export class PrinterProfileComponent {
  readonly name = signal(mockPrinterProfile.name);
  readonly email = signal(mockPrinterProfile.email);
  readonly phone = signal(mockPrinterProfile.phone);
  readonly companyName = signal(mockPrinterProfile.companyName);
  readonly address = signal(mockPrinterProfile.address);
  readonly supportedFabrics = signal<string[]>([...mockPrinterProfile.supportedFabrics]);
  readonly supportedPrintMethods = signal<string[]>([...mockPrinterProfile.supportedPrintMethods]);

  readonly fabricOptions = printerFabricOptions;
  readonly methodOptions = printerMethodOptions;

  toggleFabric(option: string): void {
    const current = this.supportedFabrics();
    this.supportedFabrics.set(
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }

  toggleMethod(option: string): void {
    const current = this.supportedPrintMethods();
    this.supportedPrintMethods.set(
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }
}
