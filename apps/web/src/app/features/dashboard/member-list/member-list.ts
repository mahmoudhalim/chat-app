import { Component, computed, inject, input } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { User } from '@shared/models';
import { ServerAPI } from 'src/app/core/services/server-api';
import { socketService } from 'src/app/core/services/socket-service';

type MemberView = {
  id: string;
  username: string;
  isOnline: boolean;
  profilePhoto?: string;
};

@Component({
  selector: 'app-member-list',
  imports: [],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
})
export class MemberList {
  serverId = input<string>();
  private readonly serverAPI = inject(ServerAPI);
  private readonly socketService = inject(socketService);

  private readonly onlineMembers = toSignal(this.socketService.onlineMembersStream, {
    initialValue: {
      userIds: [],
      count: 0,
    },
  });

  protected serverResource = rxResource({
    params: () => this.serverId(),
    stream: ({ params: id }) => {
      if (!id) {
        return of(null);
      }

      return this.serverAPI.getServer(id);
    },
  });

  protected members = computed<MemberView[]>(() => {
    const server = this.serverResource.value();
    if (!server) {
      return [];
    }

    const onlineMemberSet = new Set(this.onlineMembers().userIds);

    return server.members
      .map((member) => {
        const user = member.userId as string | User;
        const id = typeof user === 'string' ? user : user.id;
        const username = typeof user === 'string' ? 'Unknown User' : user.username;
        const profilePhoto = typeof user === 'string' ? undefined : user.profilePhoto;

        return {
          id,
          username,
          profilePhoto,
          isOnline: onlineMemberSet.has(id),
        };
      });
  });

  protected onlineList = computed(() => this.members().filter((member) => member.isOnline));
  protected offlineList = computed(() => this.members().filter((member) => !member.isOnline));

  constructor() {
    this.socketService.connect();
  }

  protected getInitials(username: string): string {
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
}
