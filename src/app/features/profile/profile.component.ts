import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { OnboardingApiService, UserPreferencesResponse } from '../../core/services/onboarding-api.service';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';
import { LogoutDialogComponent } from '../../shared/components/logout-dialog/logout-dialog.component';

type ProfileTab = 'posts' | 'marketplace' | 'rewards' | 'settings';

interface Metric {
  icon: 'shopping' | 'store' | 'dollar' | 'layers' | 'star' | 'crown';
  label: string;
  value: string;
  sub?: string;
}

const COLOR_OPTIONS = [
  { label: 'Black', value: 'Black', colorPreview: '#1A1A2E' },
  { label: 'White', value: 'White', colorPreview: '#F5F5F5' },
  { label: 'Red', value: 'Red', colorPreview: '#E74C3C' },
  { label: 'Blue', value: 'Blue', colorPreview: '#2C6BED' },
  { label: 'Green', value: 'Green', colorPreview: '#27AE60' },
  { label: 'Earth Tones', value: 'Earth Tones', colorPreview: '#A0826D' },
  { label: 'Pastels', value: 'Pastels', colorPreview: '#B8D4E3' },
  { label: 'Neutral', value: 'Neutral', colorPreview: '#95A5A6' },
];

const INTEREST_OPTIONS = [
  { label: 'Music', value: 'Music', emoji: '🎵' },
  { label: 'Travel', value: 'Travel', emoji: '✈️' },
  { label: 'Sports', value: 'Sports', emoji: '⚽' },
  { label: 'Art', value: 'Art', emoji: '🎨' },
  { label: 'Gaming', value: 'Gaming', emoji: '🎮' },
  { label: 'Photography', value: 'Photography', emoji: '📸' },
  { label: 'Tech', value: 'Tech', emoji: '💻' },
  { label: 'Fashion', value: 'Fashion', emoji: '👗' },
];

const DESIGN_OPTIONS = [
  { label: 'Bold Prints', value: 'Bold Prints', emoji: '🔥' },
  { label: 'Clean & Simple', value: 'Clean & Simple', emoji: '✨' },
  { label: 'Mixed', value: 'Mixed', emoji: '🎭' },
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, AppNavComponent, LogoutDialogComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private onboardingApi = inject(OnboardingApiService);

  readonly user = this.auth.user();

  readonly tab = signal<ProfileTab>('settings');

  // Editable form fields
  readonly formName = signal(this.user?.name ?? '');
  readonly formUsername = signal((this.user?.email ?? '').split('@')[0]);
  readonly formEmail = signal(this.user?.email ?? '');
  readonly formBio = signal("Designing quiet, sculptural pieces from Lisbon. SS '26 atelier drop now live.");
  readonly formNewPassword = signal('');

  readonly askLogout = signal(false);

  // Preferences
  readonly selectedColors = signal<string[]>([]);
  readonly selectedInterests = signal<string[]>([]);
  readonly selectedDesign = signal<string[]>([]);
  readonly prefsLoading = signal(true);
  readonly prefsSaving = signal(false);

  readonly colorOptions = COLOR_OPTIONS;
  readonly interestOptions = INTEREST_OPTIONS;
  readonly designOptions = DESIGN_OPTIONS;

  readonly metrics: Metric[] = [
    { icon: 'shopping', label: 'Items purchased', value: '38', sub: 'from 12 sellers' },
    { icon: 'store', label: 'Total orders', value: '24' },
    { icon: 'dollar', label: 'Total spent', value: '$4,218' },
    { icon: 'layers', label: 'Templates created', value: '9' },
    { icon: 'star', label: 'Avg. template rating', value: '4.82', sub: 'from other users' },
    { icon: 'crown', label: 'Top profile', value: 'Yes', sub: 'High-rated templates' },
  ];

  readonly tabs: Array<{ key: ProfileTab; label: string; hasIcon: boolean }> = [
    { key: 'posts', label: 'Community posts', hasIcon: false },
    { key: 'marketplace', label: 'Marketplace', hasIcon: false },
    { key: 'rewards', label: 'Rewards', hasIcon: false },
    { key: 'settings', label: 'Settings', hasIcon: true },
  ];

  ngOnInit(): void {
    this.loadPreferences();
  }

  private parseCsv(value: string): string[] {
    if (!value) return [];
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  private loadPreferences(): void {
    this.prefsLoading.set(true);
    this.onboardingApi.getPreferences().subscribe({
      next: (data: UserPreferencesResponse) => {
        this.selectedColors.set(this.parseCsv(data.favoriteColors));
        this.selectedInterests.set(this.parseCsv(data.interests));
        this.selectedDesign.set(this.parseCsv(data.designPreference));
        this.prefsLoading.set(false);
      },
      error: () => {
        this.prefsLoading.set(false);
      },
    });
  }

  toggleSelection(field: 'colors' | 'interests' | 'design', value: string): void {
    if (field === 'colors') {
      const current = [...this.selectedColors()];
      const idx = current.indexOf(value);
      if (idx > -1) current.splice(idx, 1);
      else current.push(value);
      this.selectedColors.set(current);
    } else if (field === 'interests') {
      const current = [...this.selectedInterests()];
      const idx = current.indexOf(value);
      if (idx > -1) current.splice(idx, 1);
      else current.push(value);
      this.selectedInterests.set(current);
    } else {
      const current = [...this.selectedDesign()];
      const idx = current.indexOf(value);
      if (idx > -1) current.splice(idx, 1);
      else current.push(value);
      this.selectedDesign.set(current);
    }
  }

  isSelected(field: 'colors' | 'interests' | 'design', value: string): boolean {
    if (field === 'colors') return this.selectedColors().includes(value);
    if (field === 'interests') return this.selectedInterests().includes(value);
    return this.selectedDesign().includes(value);
  }

  savePreferences(): void {
    this.prefsSaving.set(true);
    this.onboardingApi
      .saveOnboarding({
        favoriteColors: this.selectedColors().join(', '),
        interests: this.selectedInterests().join(', '),
        designPreference: this.selectedDesign().join(', '),
      })
      .subscribe({
        next: (res) => {
          this.prefsSaving.set(false);
          if (res.ok) {
            this.toast.success('Style preferences updated!');
          } else {
            this.toast.error(res.message);
          }
        },
        error: () => {
          this.prefsSaving.set(false);
          this.toast.error('Failed to save preferences.');
        },
      });
  }

  setTab(t: ProfileTab): void {
    this.tab.set(t);
  }

  get initials(): string {
    const name = this.user?.name ?? 'EA';
    return name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  get joinDate(): string {
    return 'January 2026';
  }

  get username(): string {
    return (this.user?.email ?? 'user').split('@')[0];
  }

  saveChanges(): void {
    const name = this.formName().trim();
    const email = this.formEmail().trim();
    const username = this.formUsername().trim();

    if (!name || !username || !email) {
      this.toast.error('Name, username and email are required.');
      return;
    }

    this.toast.success('Profile updated successfully.');
  }

  openLogout(): void {
    this.askLogout.set(true);
  }

  closeLogout(): void {
    this.askLogout.set(false);
  }
}