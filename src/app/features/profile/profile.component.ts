import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { OnboardingApiService, UserPreferencesResponse } from '../../core/services/onboarding-api.service';
import { ProfileService } from '../../core/services/profile.service'; 
import { environment } from '../../../environments/environment';

export interface UserProfileDto {
  name: string;
  username: string; 
  email: string;
  bio: string;
  photoUrl: string;
  followers: number | null;
  following: number | null;
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

  // Editable form fields
  readonly formName = signal(this.user?.name ?? '');
  readonly formUsername = signal((this.user?.email ?? '').split('@')[0]);
  readonly formEmail = signal(this.user?.email ?? '');
  readonly formBio = signal("Designing quiet, sculptural pieces from Lisbon. SS '26 atelier drop now live.");
  readonly formNewPassword = signal('');

  readonly askLogout = signal(false);
  readonly showLogoutModal = signal<boolean>(false);
  readonly isLoggingOut = signal<boolean>(false);

  // Preferences
  readonly selectedColors = signal<string[]>([]);
  readonly selectedInterests = signal<string[]>([]);
  readonly selectedDesign = signal<string[]>([]);
  readonly prefsLoading = signal(true);
  readonly prefsSaving = signal(false);

  readonly colorOptions = COLOR_OPTIONS;
  readonly interestOptions = INTEREST_OPTIONS;
  readonly designOptions = DESIGN_OPTIONS;

  selectedFile: File | null = null; 

  displayUser: UserProfileDto = {
    name: '', username: '', email: '', bio: '', photoUrl: '',
    followers: null, following: null, templatesCreated: null,
    isTopProfile: false
  };

  editForm = { name: '', bio: '' };

  ngOnInit(): void {
    this.loadPreferences();

    const currentUser = this.authService.user();
    console.log('1. Current user retrieved from AuthService:', currentUser);

    if (currentUser && currentUser.email) {
      this.profileService.getProfile(currentUser.email).subscribe({
        next: (response: any) => {
          console.log('2. Raw API response received:', response);
          const profile = response?.data ? response.data : response;

          if (profile) {
            this.displayUser = {
              name: profile.name || '',
              username: profile.userName || profile.username || '',
              email: profile.email || '',
              bio: profile.bio || '',
              photoUrl: profile.profilePictureUrl ? `${environment.apiUrl}${profile.profilePictureUrl}` : '',
              followers: profile.followersCount || 0,
              following: profile.followingCount || 0,
              templatesCreated: profile.templatesCreatedCount || 0, 
              isTopProfile: profile.isTopProfile || false
            };
            
            this.syncEditForm();
            console.log('3. displayUser object successfully populated:', this.displayUser);
          }
        },
        error: (err) => {
          console.error('X Error fetching profile data from API:', err);
        }
      });
    } else {
      console.warn('! AuthService could not find a valid email for the current user.');
    }
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
    const formData = new FormData();
    
    formData.append('Name', this.editForm.name || '');
    formData.append('Bio', this.editForm.bio || '');
    formData.append('Email', this.displayUser.email || '');
    formData.append('UserName', this.displayUser.username || '');
    
    if (this.selectedFile) {
      formData.append('ProfileImage', this.selectedFile);
    }

    this.profileService.updateProfile(formData).subscribe({
      next: (response) => {
        if (response && response.succeeded) {
          this.displayUser = {
            ...this.displayUser,
            name: this.editForm.name,
            bio: this.editForm.bio
          };
          alert('Changes saved successfully to database!');
        } else {
          alert('Error: ' + (response?.message || 'Validation failed'));
        }
      },
      error: (err) => {
        console.error('Full Error Object from server:', err);
        alert('Failed to save changes. Please check the network tab.');
      }
    });
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
