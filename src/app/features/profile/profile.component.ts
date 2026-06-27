import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { OnboardingApiService, UserPreferencesResponse } from '../../core/services/onboarding-api.service';
import { ProfileDto, ProfileService } from '../../core/services/profile.service';
import { environment } from '../../../environments/environment';
import { finalize, switchMap, throwError } from 'rxjs';

export interface UserProfileDto {
  name: string;
  username: string; 
  email: string;
  bio: string;
  photoUrl: string;
  dateJoined: string | null;
  templatesCreated: number | null;
  isTopProfile: boolean;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly router = inject(Router); 
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly onboardingApi = inject(OnboardingApiService);
  private readonly profileService = inject(ProfileService); 

  readonly user = this.authService.user();
  readonly profileLoading = signal(true);
  readonly profileSaving = signal(false);
  readonly profileError = signal('');

  readonly askLogout = signal(false);
  readonly showLogoutModal = signal<boolean>(false);
  readonly isLoggingOut = signal<boolean>(false);

  // Preferences
  readonly selectedColors = signal<string[]>([]);
  readonly selectedInterests = signal<string[]>([]);
  readonly selectedDesign = signal<string[]>([]);
  readonly prefsLoading = signal(true);
  readonly prefsSaving = signal(false);
  readonly prefsError = signal('');

  readonly colorOptions = COLOR_OPTIONS;
  readonly interestOptions = INTEREST_OPTIONS;
  readonly designOptions = DESIGN_OPTIONS;

  selectedFile: File | null = null; 

  displayUser: UserProfileDto = {
    name: '', username: '', email: '', bio: '', photoUrl: '',
    dateJoined: null, templatesCreated: null,
    isTopProfile: false
  };

  editForm = { name: '', bio: '' };

  ngOnInit(): void {
    this.loadPreferences();
    this.loadProfile();
  }

  private loadProfile(): void {
    const currentUser = this.authService.user();
    this.profileError.set('');

    if (!currentUser?.email) {
      this.profileLoading.set(false);
      this.profileError.set('Your profile could not be loaded because your account email is unavailable.');
      return;
    }

    this.profileLoading.set(true);
    this.profileService.getProfile().pipe(
      finalize(() => this.profileLoading.set(false)),
    ).subscribe({
      next: (profile) => this.applyProfile(profile),
      error: (error) => {
        const message = error?.status === 404
          ? 'A profile record was not found for this account.'
          : this.getErrorMessage(error, 'Your profile could not be loaded. Please try again.');
        this.profileError.set(message);
      },
    });
  }

  private applyProfile(profile: ProfileDto): void {
    this.displayUser = {
      name: profile.name || '',
      username: profile.userName || '',
      email: profile.email || '',
      bio: profile.bio || '',
      photoUrl: this.resolveProfileImageUrl(profile.profilePictureUrl),
      dateJoined: this.isUsableDate(profile.dateJoined) ? profile.dateJoined : null,
      templatesCreated: profile.templatesCreatedCount ?? 0,
      isTopProfile: profile.isTopProfile ?? false,
    };
    this.selectedFile = null;
    this.syncEditForm();
  }

  private resolveProfileImageUrl(path: string | null): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
    return `${environment.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private isUsableDate(value: string | null | undefined): value is string {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getUTCFullYear() > 1;
  }

  joinedDateLabel(): string {
    if (!this.displayUser.dateJoined) return '';
    return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' })
      .format(new Date(this.displayUser.dateJoined));
  }

  private parseCsv(value: string): string[] {
    if (!value) return [];
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  private loadPreferences(): void {
    this.prefsLoading.set(true);
    this.prefsError.set('');
    this.onboardingApi.getPreferences().subscribe({
      next: (data: UserPreferencesResponse) => {
        this.selectedColors.set(this.parseCsv(data.favoriteColors));
        this.selectedInterests.set(this.parseCsv(data.interests));
        this.selectedDesign.set(this.parseCsv(data.designPreference));
        this.prefsLoading.set(false);
      },
      error: (error) => {
        this.prefsLoading.set(false);
        this.prefsError.set(this.getErrorMessage(error, 'Style preferences could not be loaded.'));
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
    this.prefsError.set('');
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
          this.prefsError.set('Style preferences could not be updated.');
          this.toast.error('Failed to save preferences.');
        },
      });
  }

  syncEditForm(): void {
    this.editForm = {
      name: this.displayUser.name,
      bio: this.displayUser.bio
    };
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file; 
      const reader = new FileReader();
      reader.onload = () => {
        this.displayUser.photoUrl = reader.result as string; 
      };
      reader.readAsDataURL(file);
    }
  }

  saveChanges(): void {
    if (this.profileLoading() || this.profileSaving()) return;

    const name = this.editForm.name.trim();
    if (!name) {
      this.profileError.set('Full name is required.');
      return;
    }

    const bio = this.editForm.bio.trim();
    if (!bio) {
      this.profileError.set('Bio is required by the current profile API.');
      return;
    }

    if (!this.displayUser.email || !this.displayUser.username) {
      this.profileError.set('Your account details are incomplete, so this profile cannot be updated yet.');
      return;
    }

    const formData = new FormData();
    formData.append('Name', name);
    formData.append('Bio', bio);
    formData.append('Email', this.displayUser.email);
    formData.append('UserName', this.displayUser.username);

    if (this.selectedFile) {
      formData.append('ProfileImage', this.selectedFile);
    }

    this.profileSaving.set(true);
    this.profileError.set('');
    this.profileService.updateProfile(formData).pipe(
      switchMap((response) => {
        if (!response.succeeded) {
          return throwError(() => new Error(response.message || 'Profile update failed.'));
        }

        return this.profileService.getProfile();
      }),
      finalize(() => this.profileSaving.set(false)),
    ).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.toast.success('Profile updated successfully.');
      },
      error: (error) => {
        const message = this.getErrorMessage(error, 'Profile could not be updated. Please try again.');
        this.profileError.set(message);
        this.toast.error(message);
      },
    });
  }

  private getErrorMessage(error: any, fallback: string): string {
    const message = error?.error?.message ?? error?.error?.title ?? error?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  }

  toggleLogoutModal(value: boolean): void {
    this.showLogoutModal.set(value);
  }

  closeLogout(): void {
    this.askLogout.set(false);
  }

  confirmLogout(): void {
    this.isLoggingOut.set(true);
    setTimeout(() => {
      this.isLoggingOut.set(false);
      this.showLogoutModal.set(false);
      
      if (this.authService.logout) {
        this.authService.logout(); 
      } else {
        localStorage.removeItem('token');
      }
      
      alert('Signed out successfully');
      this.router.navigate(['/login']); 
    }, 1500);
  }
}
