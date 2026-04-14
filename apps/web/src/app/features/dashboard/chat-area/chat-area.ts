import { Component, computed, ElementRef, inject, input, linkedSignal, viewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Channel, ChannelResponse, MessageDTO } from '@shared/models';
import { of } from 'rxjs';
import { ChannelAPI } from 'src/app/core/services/channel-api';
import { socketService } from 'src/app/core/services/socket-service';
import { formatMessageDate, normalizeMessageDates } from 'src/app/core/utils/message-date';
import { AuthAPI } from 'src/app/features/auth/services/auth-api';
import 'emoji-picker-element';

@Component({
  selector: 'app-chat-area',
  imports: [FontAwesomeModule],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ChatArea {
  private readonly channelAPI = inject(ChannelAPI);
  private readonly socketService = inject(socketService);
  private readonly authAPI = inject(AuthAPI);
  private readonly messagesContainerRef = viewChild<ElementRef<HTMLElement>>('messagesContainer');
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

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

  protected isEmojiPickerOpen = false;
  protected pendingAttachment: File | null = null;
  protected isUploading = false;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.pendingAttachment = input.files[0];
    }
  }

  clearAttachment() {
    this.pendingAttachment = null;
    const fileInput = this.fileInputRef()?.nativeElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  toggleEmojiPicker() {
    this.isEmojiPickerOpen = !this.isEmojiPickerOpen;
  }

  onEmojiSelect(event: Event, input: HTMLInputElement) {
    const customEvent = event as CustomEvent;
    const emoji = customEvent.detail.unicode;

    if (emoji) {
      const start = input.selectionStart || input.value.length;
      const end = input.selectionEnd || input.value.length;

      input.value = input.value.substring(0, start) + emoji + input.value.substring(end);

      // Keep focus and restore selection after the emoji
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  }

  sendMessage(input: HTMLInputElement) {
    const text = input.value.trim();
    const channelId = this.channelId();
    const currentUser = this.authAPI.currentUser();
    const attachment = this.pendingAttachment;

    if ((!text && !attachment) || !channelId || !currentUser?.id || this.isUploading) {
      return;
    }

    this.isEmojiPickerOpen = false;

    if (attachment) {
      this.isUploading = true;
      this.channelAPI.uploadAttachment(channelId, attachment).subscribe({
        next: (response) => {
          this.isUploading = false;
          this.clearAttachment();
          input.value = '';
          this.dispatchMessage(text, channelId, currentUser, response);
        },
        error: (err) => {
          this.isUploading = false;
          console.error('Failed to upload attachment:', err);
          // Optionally show toast error here
        }
      });
    } else {
      input.value = '';
      this.dispatchMessage(text, channelId, currentUser);
    }
  }

  private dispatchMessage(
    text: string,
    channelId: string,
    currentUser: any,
    attachment?: { url: string; type: 'image' | 'pdf'; name: string }
  ) {
    const message: any = {
      channel: channelId,
      sender: currentUser.id,
      text
    };

    if (attachment) {
      message.attachment = attachment;
    }

    const optimisticMessage: MessageDTO = {
      id: `temp-${Date.now()}`,
      channel: channelId,
      sender: { id: currentUser.id, username: currentUser.username, profilePhoto: currentUser.profilePhoto },
      text,
      attachment,
      createdAt: formatMessageDate(new Date()),
      updatedAt: formatMessageDate(new Date()),
    };

    this.chatResource.update((current) => {
      if (!current) return current;
      return {
        ...current,
        messages: [...current.messages, optimisticMessage],
      };
    });

    requestAnimationFrame(() => {
      this.scrollToBottom();
    });

    this.socketService.sendMessage(message);
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
