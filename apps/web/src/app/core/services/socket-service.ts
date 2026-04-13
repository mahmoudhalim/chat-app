import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { MessageDTO, User } from '@shared/models';
import { BehaviorSubject, Subject } from 'rxjs';

type OnlineMembersPayload = {
  userIds: string[];
  count: number;
};

type VoiceStatePayload = {
  channelId: string;
  users: string[];
};

@Injectable({
  providedIn: 'root',
})
export class socketService {
  private readonly socket: Socket = io('http://localhost:3000', {
    autoConnect: false,
  });

  private messageStreamSubject = new Subject<MessageDTO>();
  messageStream = this.messageStreamSubject.asObservable();

  private onlineMembersSubject = new BehaviorSubject<OnlineMembersPayload>({
    userIds: [],
    count: 0,
  });
  onlineMembersStream = this.onlineMembersSubject.asObservable();

  private voiceStateSubject = new Subject<VoiceStatePayload>();
  voiceStateStream = this.voiceStateSubject.asObservable();

  constructor() {
    this.socket.on('chat:message', (data: MessageDTO) => {
      this.messageStreamSubject.next(data);
    });

    this.socket.on('members:online', (payload: OnlineMembersPayload) => {
      this.onlineMembersSubject.next(payload);
    });

    this.socket.on('voice:state_update', (payload: VoiceStatePayload) => {
      this.voiceStateSubject.next(payload);
    });
  }

  private ensureConnected() {
    this.socket.auth = {
      token: localStorage.getItem('accessToken'),
    };

    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  connect() {
    this.ensureConnected();
  }

  joinChannel(channelId: { channelId: string }) {
    this.ensureConnected();
    this.socket.emit('chat:join', channelId);
  }

  leaveChannel(channelId: { channelId: string }) {
    this.ensureConnected();
    this.socket.emit('chat:leave', channelId);
  }

  sendMessage(data: Pick<MessageDTO, 'channel' | 'sender' | 'text'>) {
    this.ensureConnected();
    this.socket.emit('chat:message', data);
  }

  syncVoice(channelId: string) {
    this.ensureConnected();
    this.socket.emit('voice:sync_request', { channelId });
  }
}

