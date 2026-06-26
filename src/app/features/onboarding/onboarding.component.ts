import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { OnboardingApiService } from '../../core/services/onboarding-api.service';
import { ToastService } from '../../core/services/toast.service';
import { logoImage } from '../../core/data/wearly-data';

export interface OnboardingStep {
  id: number;
  question: string;
  subtitle: string;
  options: OnboardingOption[];
  field: 'favoriteColors' | 'interests' | 'designPreference';
  icon: string;
}

export interface OnboardingOption {
  label: string;
  value: string;
  emoji?: string;
  colorPreview?: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    question: 'What colors do you usually like to wear?',
    subtitle: 'Pick one or more that resonate with your style.',
    field: 'favoriteColors',
    icon: 'palette',
    options: [
      { label: 'Black', value: 'Black', colorPreview: '#1A1A2E' },
      { label: 'White', value: 'White', colorPreview: '#F5F5F5' },
      { label: 'Red', value: 'Red', colorPreview: '#E74C3C' },
      { label: 'Blue', value: 'Blue', colorPreview: '#2C6BED' },
      { label: 'Green', value: 'Green', colorPreview: '#27AE60' },
      { label: 'Earth Tones', value: 'Earth Tones', colorPreview: '#A0826D' },
      { label: 'Pastels', value: 'Pastels', colorPreview: '#B8D4E3' },
      { label: 'Neutral', value: 'Neutral', colorPreview: '#95A5A6' },
    ],
  },
  {
    id: 2,
    question: 'What are your interests or hobbies?',
    subtitle: 'Help us tailor content to what you love.',
    field: 'interests',
    icon: 'heart',
    options: [
      { label: 'Music', value: 'Music', emoji: '🎵' },
      { label: 'Travel', value: 'Travel', emoji: '✈️' },
      { label: 'Sports', value: 'Sports', emoji: '⚽' },
      { label: 'Art', value: 'Art', emoji: '🎨' },
      { label: 'Gaming', value: 'Gaming', emoji: '🎮' },
      { label: 'Photography', value: 'Photography', emoji: '📸' },
      { label: 'Tech', value: 'Tech', emoji: '💻' },
      { label: 'Fashion', value: 'Fashion', emoji: '👗' },
    ],
  },
  {
    id: 3,
    question: 'Do you prefer bold or minimal designs?',
    subtitle: 'This shapes your template and product recommendations.',
    field: 'designPreference',
    icon: 'sparkles',
    options: [
      { label: 'Bold Prints', value: 'Bold Prints', emoji: '🔥' },
      { label: 'Clean & Simple', value: 'Clean & Simple', emoji: '✨' },
      { label: 'Mixed', value: 'Mixed', emoji: '🎭' },
    ],
  },
];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  private auth = inject(AuthService);
  private onboardingApi = inject(OnboardingApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly logo = logoImage;
  readonly firstName = (this.auth.user()?.name ?? 'there').split(' ')[0];
  readonly steps = STEPS;

  readonly currentStep = signal(0);
  readonly selections = signal<Record<string, string[]>>({});

  readonly saving = signal(false);

  get currentStepData(): OnboardingStep {
    return this.steps[this.currentStep()];
  }

  get isFirstStep(): boolean {
    return this.currentStep() === 0;
  }

  get isLastStep(): boolean {
    return this.currentStep() === this.steps.length - 1;
  }

  get progressPercent(): number {
    return ((this.currentStep() + 1) / this.steps.length) * 100;
  }

  get canProceed(): boolean {
    const field = this.currentStepData.field;
    return (this.selections()[field]?.length ?? 0) > 0;
  }

  toggleOption(field: string, value: string): void {
    const current = [...(this.selections()[field] ?? [])];
    const idx = current.indexOf(value);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }
    this.selections.update((s) => ({ ...s, [field]: current }));
  }

  isSelected(field: string, value: string): boolean {
    return this.selections()[field]?.includes(value) ?? false;
  }

  nextStep(): void {
    if (!this.canProceed) return;
    if (this.isLastStep) {
      this.finish();
      return;
    }
    this.currentStep.update((s) => s + 1);
  }

  prevStep(): void {
    if (!this.isFirstStep) {
      this.currentStep.update((s) => s - 1);
    }
  }

  finish(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const sel = this.selections();
    this.onboardingApi
      .saveOnboarding({
        favoriteColors: (sel['favoriteColors'] ?? []).join(', '),
        interests: (sel['interests'] ?? []).join(', '),
        designPreference: (sel['designPreference'] ?? []).join(', '),
      })
      .subscribe({
        next: (res) => {
          if (res.ok) {
            this.auth.markOnboardingComplete();
            this.toast.success('Style profile saved — welcome to Wearly!');
            this.router.navigate(['/dashboard']);
          } else {
            this.toast.error(res.message);
            this.saving.set(false);
          }
        },
        error: () => {
          // Still mark locally so user isn't stuck
          this.auth.markOnboardingComplete();
          this.toast.success('Welcome to Wearly!');
          this.router.navigate(['/dashboard']);
        },
      });
  }

  skip(): void {
    this.auth.markOnboardingComplete();
    this.router.navigate(['/dashboard']);
  }

  signOut(): void {
    this.auth.logout().subscribe((result) => {
      if (result.ok) {
        this.toast.success(result.message ?? 'Signed out successfully.');
        this.router.navigate(['/auth']);
      } else {
        this.toast.error(result.message ?? result.error ?? 'Logout failed.');
      }
    });
  }
}