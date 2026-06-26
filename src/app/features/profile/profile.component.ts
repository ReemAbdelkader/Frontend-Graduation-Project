import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export interface UserProfileDto {
  name: string;
  username: string;
  email: string;
  bio: string;
  photoUrl: string;
  followers: number | null;
  following: number | null;
  designsCount: number | null;
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
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  activeTab = signal<string>('settings');
  
  showLogoutModal = signal<boolean>(false);
  isLoggingOut = signal<boolean>(false);

  displayUser: UserProfileDto = {
    name: '',
    username: '', 
    email: '',
    bio: '',
    photoUrl: '',
    followers: null,
    following: null,
    designsCount: null,
    itemsPurchased: null,
    totalOrders: null,
    totalSpent: null,
    templatesCreated: null,
    avgRating: null,
    isTopProfile: false
  };

  editForm = {
    name: '',
    username: '',
    email: '',
    bio: '',
    password: ''
  };

  userOrders = signal<any[]>([]); 
  userRewards = signal<any[]>([]);
  userTemplates = signal<any[]>([]);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab.set(params['tab']);
      }
    });

    const currentUser = this.authService.user();
    if (currentUser) {
      this.displayUser.name = currentUser.name;
      this.displayUser.email = currentUser.email;
      this.displayUser.username = ''; 
      this.syncEditForm();
    }
  }

  syncEditForm(): void {
    this.editForm = {
      name: this.displayUser.name,
      username: this.displayUser.username,
      email: this.displayUser.email,
      bio: this.displayUser.bio,
      password: ''
    };
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.displayUser.photoUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveChanges(): void {
    this.displayUser = {
      ...this.displayUser,
      name: this.editForm.name,
      username: this.editForm.username,
      email: this.editForm.email,
      bio: this.editForm.bio
    };
    console.log('Profile saved locally:', this.displayUser);
    alert('Changes saved successfully!');
  }

  toggleLogoutModal(value: boolean): void {
    this.showLogoutModal.set(value);
  }

  confirmLogout(): void {
    this.isLoggingOut.set(true);
    setTimeout(() => {
      this.isLoggingOut.set(false);
      this.showLogoutModal.set(false);
      alert('Signed out successfully');
    }, 1500);
  }
}