import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router'; 
import { AuthService } from '../../core/services/auth.service';
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
  itemsPurchased: number | null;
  totalOrders: number | null;
  totalSpent: number | null;
  templatesCreated: number | null;
  avgRating: number | null;
  isTopProfile: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router); 
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService); 

  readonly activeTab = signal<string>('settings');
  readonly showLogoutModal = signal<boolean>(false);
  readonly isLoggingOut = signal<boolean>(false);
  
  selectedFile: File | null = null; 

  displayUser: UserProfileDto = {
    name: '', username: '', email: '', bio: '', photoUrl: '',
    followers: null, following: null, itemsPurchased: null, 
    totalOrders: null, totalSpent: null, templatesCreated: null, 
    avgRating: null, isTopProfile: false
  };

  editForm = { name: '', bio: '' };

  readonly userOrders = signal<any[]>([]); 
  readonly userRewards = signal<any[]>([]);
  readonly userTemplates = signal<any[]>([]);

  // ngOnInit(): void {
  //   this.route.queryParams.subscribe(params => {
  //     if (params['tab']) { 
  //       this.activeTab.set(params['tab']); 
  //     }
  //   });

  //   const currentUser = this.authService.user();
  //   if (currentUser && currentUser.email) {
  //     this.profileService.getProfile(currentUser.email).subscribe({
  //       next: (profile) => {
  //         if (profile) {
  //           this.displayUser = {
  //             name: profile.name,
  //             username: profile.userName,
  //             email: profile.email,
  //             bio: profile.bio || '',
  //             photoUrl: profile.profilePictureUrl ? `${environment.apiUrl}${profile.profilePictureUrl}` : '',
  //             followers: profile.followersCount,
  //             following: profile.followingCount,
  //             itemsPurchased: profile.itemsPurchasedCount,
  //             totalOrders: profile.totalOrdersCount,
  //             totalSpent: profile.totalSpent,
  //             templatesCreated: profile.templatesCreatedCount, 
  //             avgRating: profile.avgTemplateRating,
  //             isTopProfile: profile.isTopProfile || false
  //           };
  //           this.syncEditForm();
  //         }
  //       },
  //       error: (err) => console.error(err)
  //     });
  //   }
  // }
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) { 
        this.activeTab.set(params['tab']); 
      }
    });

    const currentUser = this.authService.user();
    console.log('1. Current user retrieved from AuthService:', currentUser);

    if (currentUser && currentUser.email) {
      this.profileService.getProfile(currentUser.email).subscribe({
        next: (response: any) => {
          console.log('2. Raw API response received:', response);

          // Dynamically handles both wrapped (response.data) and direct responses, as well as casing inconsistencies
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
              itemsPurchased: profile.itemsPurchasedCount || 0,
              totalOrders: profile.totalOrdersCount || 0,
              totalSpent: profile.totalSpent || 0,
              templatesCreated: profile.templatesCreatedCount || 0, 
              avgRating: profile.avgTemplateRating || 0,
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