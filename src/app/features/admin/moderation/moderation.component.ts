import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import {
  mockModerationReports,
  MockModerationReport,
  ModerationStatus,
} from '../../../core/data/admin-mock-data';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './moderation.component.html',
  styleUrl: './moderation.component.scss',
})
export class ModerationComponent {
  private toast = inject(ToastService);

  readonly reports = signal<MockModerationReport[]>(mockModerationReports);
  readonly statusFilter = signal<ModerationStatus | 'All'>('All');

  /** Track per-row action-taken input values keyed by report id. */
  readonly actionInputs = signal<Record<string, string>>({});

  readonly statuses: Array<ModerationStatus | 'All'> = [
    'All', 'Pending', 'Reviewed', 'ActionTaken', 'Dismissed',
  ];

  readonly filtered = computed(() => {
    const sf = this.statusFilter();
    if (sf === 'All') return this.reports();
    return this.reports().filter((r) => r.status === sf);
  });

  readonly counts = computed(() => {
    const all = this.reports();
    return {
      All: all.length,
      Pending: all.filter((r) => r.status === 'Pending').length,
      Reviewed: all.filter((r) => r.status === 'Reviewed').length,
      ActionTaken: all.filter((r) => r.status === 'ActionTaken').length,
      Dismissed: all.filter((r) => r.status === 'Dismissed').length,
    };
  });

  constructor() {
    // Initialise action inputs for any reports that already have an actionTaken value.
    const init: Record<string, string> = {};
    mockModerationReports.forEach((r) => { init[r.id] = r.actionTaken ?? ''; });
    this.actionInputs.set(init);
  }

  setStatusFilter(s: ModerationStatus | 'All'): void {
    this.statusFilter.set(s);
  }

  /** Safe count accessor for the template. */
  getCount(s: ModerationStatus | 'All'): number {
    return this.counts()[s] ?? 0;
  }

  setAction(reportId: string, value: string): void {
    this.actionInputs.update((m) => ({ ...m, [reportId]: value }));
  }

  resolve(report: MockModerationReport): void {
    const action = (this.actionInputs()[report.id] ?? '').trim();
    if (!action) {
      this.toast.error('Please describe the action taken before resolving.');
      return;
    }
    this.reports.update((s) =>
      s.map((r) =>
        r.id === report.id
          ? { ...r, status: 'ActionTaken' as ModerationStatus, actionTaken: action }
          : r,
      ),
    );
    this.toast.success(`Report on "${report.templateName}" resolved.`);
  }

  statusLabel(s: string): string {
    switch (s) {
      case 'Pending': return 'Pending';
      case 'Reviewed': return 'Reviewed';
      case 'ActionTaken': return 'Action Taken';
      case 'Dismissed': return 'Dismissed';
      default: return s;
    }
  }
}
