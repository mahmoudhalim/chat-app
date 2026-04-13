import { Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { of } from 'rxjs';
import { ChannelAPI } from 'src/app/core/services/channel-api';
import { ServerAPI } from 'src/app/core/services/server-api';
import { VoiceService } from 'src/app/core/services/voice.service';
import { socketService } from 'src/app/core/services/socket-service';
import { AuthAPI } from 'src/app/features/auth/services/auth-api';
import { Channel } from '@shared/models';

@Component({
  selector: 'app-channel-list-content',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './channel-list-content.html',
  styleUrl: './channel-list-content.css',
})
export class ChannelListContent {
  serverId = input<string>();

  private readonly channelAPI = inject(ChannelAPI);
  private readonly serverAPI = inject(ServerAPI);
  protected readonly voiceService = inject(VoiceService);
  private readonly socketService = inject(socketService);
  protected readonly authAPI = inject(AuthAPI);
  private readonly fb = inject(NonNullableFormBuilder);

  protected channelResource = rxResource({
    params: () => this.serverId(),
    stream: ({ params: id }) => {
      if (!id) return of([]);
      return this.channelAPI.getChannelList(id);
    },
  });

  protected serverResource = rxResource({
    params: () => this.serverId(),
    stream: ({ params: id }) => {
      if (!id) return of(null);
      return this.serverAPI.getServer(id);
    },
  });

  private readonly createChannelModalRef = viewChild<ElementRef<HTMLDialogElement>>('createChannelModal');
  private readonly inviteModalRef = viewChild<ElementRef<HTMLDialogElement>>('inviteModal');

  protected createChannelForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    type: ['text' as 'text' | 'voice', [Validators.required]],
  });

  protected isCreatingChannel = false;
  protected showErrorToast = false;
  protected showSuccessToast = false;
  protected toastMessage = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.socketService.voiceStateStream.subscribe((update) => {
      this.channelResource.update((channels) => {
        if (!channels) return channels;
        return channels.map((c) =>
          c.id === update.channelId ? { ...c, voiceParticipants: update.users } : c
        );
      });
    });
  }

  protected isServerOwner(): boolean {
    const currentUser = this.authAPI.currentUser();
    const server = this.serverResource.value();
    
    if (!currentUser || !server) return false;
    
    // Handle both cases: when ownerId is populated (object) or just a string ID
    const ownerId = typeof server.ownerId === 'string' ? server.ownerId : (server.ownerId as any)?.id || (server.ownerId as any)?._id;
    
    console.log('isServerOwner check:', { 
      currentUserId: currentUser.id, 
      serverOwnerId: ownerId,
      rawServerOwnerId: server.ownerId,
      isMatch: String(currentUser.id) === String(ownerId)
    });
    
    return String(currentUser.id) === String(ownerId);
  }

  protected openCreateChannelModal(): void {
    if (!this.isServerOwner()) return;
    this.createChannelForm.reset({ name: '', type: 'text' });
    this.createChannelModalRef()?.nativeElement.showModal();
  }

  protected openInviteModal(): void {
    if (!this.isServerOwner()) return;
    this.inviteModalRef()?.nativeElement.showModal();
  }

  protected copyInviteCode(): void {
    const inviteCode = this.serverResource.value()?.inviteCode;
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).then(() => {
        this.showToast('Invite code copied to clipboard!', true);
      }).catch(() => {
        this.showToast('Failed to copy invite code.', false);
      });
    }
  }

  protected onCreateChannel(): void {
    if (this.createChannelForm.invalid || this.isCreatingChannel) {
      this.createChannelForm.markAllAsTouched();
      return;
    }

    const { name, type } = this.createChannelForm.getRawValue();
    const sid = this.serverId();
    if (!sid) return;

    this.isCreatingChannel = true;

    this.channelAPI.createChannel(sid, name, type).subscribe({
      next: (newChannel) => {
        this.isCreatingChannel = false;
        this.channelResource.update((prev) => prev ? [...prev, newChannel] : [newChannel]);
        this.createChannelModalRef()?.nativeElement.close();
      },
      error: (error) => {
        this.isCreatingChannel = false;
        const message = error?.error?.message || 'Failed to create channel';
        this.showToast(message, false);
      },
    });
  }

  private showToast(message: string, success: boolean): void {
    this.toastMessage = message;
    this.showErrorToast = !success;
    this.showSuccessToast = success;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.showErrorToast = false;
      this.showSuccessToast = false;
      this.toastMessage = '';
      this.toastTimer = null;
    }, 3000);
  }

  protected onChannelClick(event: Event, channel: Channel) {
    if (channel.type === 'voice') {
      event.preventDefault();
      this.voiceService.join(channel.id, channel.name);
    }
  }

  protected getInitials(username: string): string {
    if (!username) return 'U';
    return username.trim().slice(0, 2).toUpperCase();
  }

  protected getProfilePhotoSrc(profilePhoto: string | undefined): string | null {
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

  protected getVoiceUser(userId: string) {
    const server = this.serverResource.value();
    if (!server || !server.members) return null;
    
    const member = server.members.find(m => {
      // Handle populated member (User object) or just string ID
      const mId = typeof m.userId === 'string' ? m.userId : (m.userId as any).id;
      return mId === userId;
    });

    if (!member) return null;

    // Return the populated user object
    return typeof member.userId === 'string' ? null : member.userId as any;
  }
}

