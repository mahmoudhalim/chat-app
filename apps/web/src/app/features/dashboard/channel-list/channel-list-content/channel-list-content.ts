import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { of } from 'rxjs';
import { ChannelAPI } from 'src/app/core/services/channel-api';
import { ServerAPI } from 'src/app/core/services/server-api';
import { VoiceService } from 'src/app/core/services/voice.service';
import { socketService } from 'src/app/core/services/socket-service';
import { Channel } from '@shared/models';

@Component({
  selector: 'app-channel-list-content',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive],
  templateUrl: './channel-list-content.html',
  styleUrl: './channel-list-content.css',
})
export class ChannelListContent {
  serverId = input<string>();

  private readonly channelAPI = inject(ChannelAPI);
  private readonly serverAPI = inject(ServerAPI);
  protected readonly voiceService = inject(VoiceService);
  private readonly socketService = inject(socketService);

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

