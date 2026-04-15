import { Component, ElementRef, inject, OnDestroy, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthAPI } from 'src/app/features/auth/services/auth-api';
import { VoiceService } from 'src/app/core/services/voice-service';
import { ThemeService, AVAILABLE_THEMES } from 'src/app/core/services/theme-service';

@Component({
  selector: 'app-channel-user-controls',
  imports: [FontAwesomeModule, ReactiveFormsModule],
  templateUrl: './channel-user-controls.html',
  styleUrl: './channel-user-controls.css',
})
export class ChannelUserControls implements OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  protected readonly authAPI = inject(AuthAPI);
  protected readonly voiceService = inject(VoiceService);
  protected readonly themeService = inject(ThemeService);

  public themes = AVAILABLE_THEMES;
  public currentTheme = this.themeService.currentTheme;

  private readonly profileModalRef = viewChild<ElementRef<HTMLDialogElement>>('profileModal');
  private readonly profilePhotoInputRef = viewChild<ElementRef<HTMLInputElement>>('profilePhotoInput');

  protected readonly profileForm = this.fb.group({
    username: ['', [Validators.required, Validators.pattern(/^\S+$/), Validators.maxLength(30)]],
    password: ['', [Validators.minLength(6)]],
  });

  protected profilePhotoFile: File | null = null;
  protected profilePhotoFileName = '';
  protected isSavingProfile = false;
  protected isLoggingOut = false;
  protected showSuccessToast = false;
  protected showErrorToast = false;
  protected toastMessage = '';
  protected isUserMenuOpen = false;

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  protected openProfileModal(): void {
    const currentUser = this.authAPI.currentUser();
    if (!currentUser) {
      return;
    }

    this.profileForm.reset({
      username: currentUser.username,
      password: '',
    });
    this.profilePhotoFile = null;
    this.profilePhotoFileName = '';
    const profilePhotoInput = this.profilePhotoInputRef()?.nativeElement;
    if (profilePhotoInput) {
      profilePhotoInput.value = '';
    }

    this.profileModalRef()?.nativeElement.showModal();
  }

  protected onProfilePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.profilePhotoFile = file;
    this.profilePhotoFileName = file?.name ?? '';
  }

  protected onThemeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.themeService.setTheme(select.value);
  }

  protected toggleUserMenu(event?: Event): void {
    event?.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  protected closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  protected saveProfile(): void {
    const currentUser = this.authAPI.currentUser();
    if (!currentUser || this.isSavingProfile) {
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.showToast('Please fix form errors before saving', 'error');
      return;
    }

    const profileValue = this.profileForm.getRawValue();
    const nextUsername = profileValue.username.trim();
    const nextPassword = profileValue.password.trim();

    const hasUsernameChange = nextUsername.length > 0 && nextUsername !== currentUser.username;
    const hasPasswordChange = nextPassword.length > 0;
    const hasPhotoChange = this.profilePhotoFile !== null;

    if (!hasUsernameChange && !hasPasswordChange && !hasPhotoChange) {
      this.showToast('No changes to save', 'error');
      return;
    }

    const profileData = new FormData();

    if (hasUsernameChange) {
      profileData.append('username', nextUsername);
    }

    if (hasPasswordChange) {
      profileData.append('password', nextPassword);
    }

    if (this.profilePhotoFile) {
      profileData.append('profilePhoto', this.profilePhotoFile);
    }

    this.isSavingProfile = true;

    this.authAPI.updateProfile(currentUser.id, profileData).subscribe({
      next: () => {
        this.isSavingProfile = false;
        this.profileModalRef()?.nativeElement.close();
        this.showToast('Profile updated successfully', 'success');
      },
      error: (error) => {
        this.isSavingProfile = false;
        const message = error?.error?.message as string | undefined;
        this.showToast(message ?? 'Failed to update profile', 'error');
      },
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.showSuccessToast = type === 'success';
    this.showErrorToast = type === 'error';

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.showSuccessToast = false;
      this.showErrorToast = false;
      this.toastMessage = '';
      this.toastTimer = null;
    }, 3000);
  }

  protected getCurrentUserInitials(): string {
    const username = this.authAPI.currentUser()?.username?.trim();
    if (!username) {
      return 'US';
    }

    return username.slice(0, 2).toUpperCase();
  }

  protected getCurrentUserPhotoSrc(): string | null {
    const profilePhoto = this.authAPI.currentUser()?.profilePhoto;
    if (!profilePhoto) {
      return null;
    }

    if (
      profilePhoto.startsWith('http://') ||
      profilePhoto.startsWith('https://') ||
      profilePhoto.startsWith('/')
    ) {
      return profilePhoto;
    }

    return `/api/uploads/${profilePhoto}`;
  }

  protected logout(): void {
    if (this.isLoggingOut) return;
    this.closeUserMenu();
    this.isLoggingOut = true;

    if (this.voiceService.connectionState() !== 'disconnected') {
      this.voiceService.leave();
    }

    this.authAPI.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoggingOut = false;
        this.showToast('Failed to logout', 'error');
      },
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }
}
