import { Component, computed, ElementRef, inject, input, linkedSignal, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Channel, ChannelResponse, MessageDTO } from '@shared/models';
import { of } from 'rxjs';
import { ChannelAPI } from 'src/app/core/services/channel-api';
import { socketService } from 'src/app/core/services/socket-service';
import { formatMessageDate, normalizeMessageDates } from 'src/app/core/utils/message-date';
import { AuthAPI } from 'src/app/features/auth/services/auth-api';

@Component({
  selector: 'app-chat-area',
  imports: [FontAwesomeModule],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.css',
})
export class ChatArea {
  private readonly channelAPI = inject(ChannelAPI);
  private readonly socketService = inject(socketService);
  private readonly authAPI = inject(AuthAPI);
  private readonly messagesContainerRef = viewChild<ElementRef<HTMLElement>>('messagesContainer');

  channelId = input<string>();
  unreadCount = linkedSignal({
    source: this.channelId,
    computation: () => 0,
  });

  constructor() {
    this.socketService.connect();

    this.socketService.messageStream.pipe(takeUntilDestroyed()).subscribe((message) => {
      if (message.channel === this.channelId()) {
        const container = this.messagesContainerRef()?.nativeElement;
        const shouldAutoScroll = container ? this.isNearBottom(container) : false;
        const formattedMessage = normalizeMessageDates(message);

        this.chatResource.update((current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            messages: [...(current?.messages ?? []), formattedMessage],
          };
        });

        requestAnimationFrame(() => {
          if (!container) {
            return;
          }

          if (shouldAutoScroll) {
            this.scrollToBottom();
            return;
          }

          this.unreadCount.update((count) => count + 1);
        });
      }
    });
  }

  protected chatResource = rxResource({
    params: () => this.channelId(),
    stream: ({ params: id }) => {
      if (!id) {
        return of<ChannelResponse | null>(null);
      }

      return this.channelAPI.getMessages(id);
    },
  });

  messages = computed<MessageDTO[]>(() => this.chatResource.value()?.messages ?? []);
  channel = computed<Channel | null>(() => {

    return this.chatResource.value()?.channel ?? null
  });

  sendMessage(input: HTMLInputElement) {
    const text = input.value.trim();
    const channelId = this.channelId();
    const currentUser = this.authAPI.currentUser();

    if (!text || !channelId || !currentUser?.id) {
      return;
    }

    const message = {
      channel: channelId,
      sender: currentUser.id,
      text
    };

    const optimisticMessage: MessageDTO = {
      id: `temp-${Date.now()}`,
      channel: channelId,
      sender: { id: currentUser.id, username: currentUser.username, profilePhoto: currentUser.profilePhoto },
      text,
      createdAt: formatMessageDate(new Date()),
      updatedAt: formatMessageDate(new Date()),
    };

    this.chatResource.update((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        messages: [...current.messages, optimisticMessage],
      };
    });

    requestAnimationFrame(() => {
      this.scrollToBottom();
    });

    this.socketService.sendMessage(message);



    input.value = '';
  }

  onMessagesScroll() {
    const messagesContainer = this.messagesContainerRef()?.nativeElement;
    if (!messagesContainer) {
      return;
    }

    if (this.isNearBottom(messagesContainer)) {
      this.unreadCount.set(0);
    }
  }

  jumpToLatest() {
    this.scrollToBottom();
    this.unreadCount.set(0);
  }

  private isNearBottom(messagesContainer: HTMLElement): boolean {
    const remaining = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    return remaining <= 40;
  }

  private scrollToBottom() {
    const messagesContainer = this.messagesContainerRef()?.nativeElement;
    if (!messagesContainer) {
      return;
    }

    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth',
    });
  }

  protected getInitials(username: string): string {
    if (!username) return 'U';
    return username.trim().slice(0, 2).toUpperCase();
  }

  protected getSenderUsername(message: MessageDTO): string {
    return typeof message.sender === 'string' ? 'Unknown User' : message.sender.username;
  }

  protected getSenderProfilePhoto(message: MessageDTO): string | undefined {
    return typeof message.sender === 'string' ? undefined : message.sender.profilePhoto;
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
