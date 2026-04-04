import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { MessageDTO } from '@shared/models';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class socketService {
  private readonly socket: Socket = io('http://localhost:3000', {
    autoConnect: false,
  });

  private messageStreamSubject = new Subject<MessageDTO>();
  messageStream = this.messageStreamSubject.asObservable();

  constructor() {
    this.socket.on('chat:message', (data: MessageDTO) => {
      this.messageStreamSubject.next(data);
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
}
