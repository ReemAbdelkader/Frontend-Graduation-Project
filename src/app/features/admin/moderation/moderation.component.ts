import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import {
  AdminApiService,
  ModerationReportDto,
  ModerationStatus,
} from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './moderation.component.html',
  styleUrl: './moderation.component.scss',
})
export class ModerationComponent implements OnInit {
  private toast = inject(ToastService);
  private adminApi = inject(AdminApiService);

  readonly reports = signal<ModerationReportDto[]>([]);
  readonly allReports = signal<ModerationReportDto[]>([]);
  readonly statusFilter = signal<ModerationStatus | 'All'>('All');
  readonly loading = signal(true);
  readonly resolvingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly actionInputs = signal<Record<string, string>>({});

  readonly statuses: Array<ModerationStatus | 'All'> = [
    'All', 'Pending', 'Reviewed', 'ActionTaken', 'Dismissed',
  ];

  readonly filtered = computed(() => this.reports());

  readonly counts = computed(() => {
    const all = this.allReports();
    return {
      All: all.length,
      Pending: all.filter((r) => r.status === 'Pending').length,
      Reviewed: all.filter((r) => r.status === 'Reviewed').length,
      ActionTaken: all.filter((r) => r.status === 'ActionTaken').length,
      Dismissed: all.filter((r) => r.status === 'Dismissed').length,
    };
  });

  ngOnInit(): void {
    this.loadInitialReports();
  }

  loadInitialReports(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminApi.getModerationReports('All', 1, 100).subscribe({
      next: (result) => {
        const reports = result.data ?? [];
        this.allReports.set(reports);
        this.reports.set(reports);
        this.seedActionInputs(reports);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.extractError(err, 'Unable to load moderation reports.'));
        this.loading.set(false);
      },
    });
  }

  setStatusFilter(s: ModerationStatus | 'All'): void {
    this.statusFilter.set(s);
    this.loading.set(true);
    this.error.set(null);
    this.adminApi.getModerationReports(s, 1, 100).subscribe({
      next: (result) => {
        const reports = result.data ?? [];
        this.reports.set(reports);
        this.seedActionInputs(reports);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.extractError(err, 'Unable to load moderation reports.'));
        this.loading.set(false);
      },
    });
  }

  getCount(s: ModerationStatus | 'All'): number {
    return this.counts()[s] ?? 0;
  }

  setAction(reportId: string, value: string): void {
    this.actionInputs.update((m) => ({ ...m, [reportId]: value }));
  }

  resolve(report: ModerationReportDto): void {
    const action = (this.actionInputs()[report.id] ?? '').trim();
    if (!action) {
      this.toast.error('Please describe the action taken before resolving.');
      return;
    }

    this.resolvingId.set(report.id);
    this.adminApi.resolveModerationReport(report.id, action).subscribe({
      next: () => {
        this.toast.success(`Report on "${report.targetTemplateName}" resolved.`);
        this.resolvingId.set(null);
        this.loadAfterResolve();
      },
      error: (err) => {
        this.toast.error(this.extractError(err, 'Report resolution failed.'));
        this.resolvingId.set(null);
      },
    });
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

  private loadAfterResolve(): void {
    this.adminApi.getModerationReports('All', 1, 100).subscribe({
      next: (result) => {
        this.allReports.set(result.data ?? []);
        this.setStatusFilter(this.statusFilter());
      },
      error: (err) => this.toast.error(this.extractError(err, 'Moderation list refresh failed.')),
    });
  }

  private seedActionInputs(reports: ModerationReportDto[]): void {
    this.actionInputs.update((current) => {
      const next = { ...current };
      reports.forEach((r) => {
        if (next[r.id] === undefined) next[r.id] = r.actionTaken ?? '';
      });
      return next;
    });
  }

  private extractError(error: unknown, fallback: string): string {
    const err = error as { error?: { message?: string; errors?: string[] } | string; message?: string };
    if (typeof err?.error === 'string') return err.error;
    return err?.error?.message ?? err?.error?.errors?.join(', ') ?? err?.message ?? fallback;
  }
}
