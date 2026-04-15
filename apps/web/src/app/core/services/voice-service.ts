import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { socketService } from './socket-service';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
  Participant,
  LocalParticipant,
} from 'livekit-client';
import { firstValueFrom } from 'rxjs';

export interface VoiceTokenResponse {
  token: string;
  wsUrl: string;
}

export interface VoiceParticipant {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VoiceService {
  private readonly http = inject(HttpClient);
  private readonly socketService = inject(socketService);


  public readonly room: Room;

  // Signals for UI reactivity
  public connectionState = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  public currentChannelId = signal<string | null>(null);
  public currentChannelName = signal<string | null>(null);
  public participants = signal<VoiceParticipant[]>([]);

  public isMuted = signal<boolean>(false);
  public isDeafened = signal<boolean>(false);

  // Audio elements container to attach remote tracks
  private audioContainer: HTMLDivElement;

  constructor() {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    // Create a hidden container for audio elements
    this.audioContainer = document.createElement('div');
    this.audioContainer.id = 'livekit-audio-container';
    this.audioContainer.style.display = 'none';
    document.body.appendChild(this.audioContainer);

    this.setupRoomEvents();
  }

  private setupRoomEvents() {
    this.room
      .on(RoomEvent.Connected, () => {
        this.connectionState.set('connected');
        this.updateParticipants();
      })
      .on(RoomEvent.Disconnected, () => {
        this.connectionState.set('disconnected');
        this.currentChannelId.set(null);
        this.currentChannelName.set(null);
        this.participants.set([]);
        this.audioContainer.innerHTML = ''; // Clear audio elements
      })
      .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          this.audioContainer.appendChild(audioElement);
          this.applyDeafenState(); // Ensure new tracks respect deafen state
        }
        this.updateParticipants();
      })
      .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        track.detach();
        this.updateParticipants();
      })
      .on(RoomEvent.ParticipantConnected, () => this.updateParticipants())
      .on(RoomEvent.ParticipantDisconnected, () => this.updateParticipants())
      .on(RoomEvent.ActiveSpeakersChanged, () => this.updateParticipants())
      .on(RoomEvent.TrackMuted, () => this.updateParticipants())
      .on(RoomEvent.TrackUnmuted, () => this.updateParticipants())
      .on(RoomEvent.LocalTrackPublished, () => this.updateParticipants())
      .on(RoomEvent.LocalTrackUnpublished, () => this.updateParticipants());
  }

  private updateParticipants() {
    if (this.connectionState() !== 'connected') {
      this.participants.set([]);
      return;
    }

    const allParticipants: VoiceParticipant[] = [];

    // Add local participant
    const local = this.room.localParticipant;
    allParticipants.push({
      identity: local.identity,
      name: local.name || 'You',
      isSpeaking: local.isSpeaking,
      isMuted: !local.isMicrophoneEnabled,
    });

    // Add remote participants
    this.room.remoteParticipants.forEach((participant) => {
      allParticipants.push({
        identity: participant.identity,
        name: participant.name || participant.identity,
        isSpeaking: participant.isSpeaking,
        isMuted: !participant.isMicrophoneEnabled,
      });
    });

    this.participants.set(allParticipants);
  }

  public async join(channelId: string, channelName: string) {
    if (this.connectionState() === 'connected' || this.connectionState() === 'connecting') {
      if (this.currentChannelId() === channelId) {
        return; // Already in this channel
      }
      await this.leave(); // Disconnect from current before joining new
    }

    try {
      this.connectionState.set('connecting');
      this.currentChannelId.set(channelId);
      this.currentChannelName.set(channelName);

      // Fetch token from backend
      const response = await firstValueFrom(
        this.http.get<VoiceTokenResponse>(`/api/channels/${channelId}/voice-token`)
      );

      // Connect to LiveKit room
      await this.room.connect(response.wsUrl, response.token);

      // Enable microphone by default if not deafened/muted
      if (!this.isMuted() && !this.isDeafened()) {
        await this.room.localParticipant.setMicrophoneEnabled(true);
      }

      // Tell the backend to sync everyone
      this.socketService.syncVoice(channelId);

    } catch (error) {
      console.error('Failed to join voice channel:', error);
      this.connectionState.set('disconnected');
      this.currentChannelId.set(null);
      this.currentChannelName.set(null);
      throw error;
    }
  }

  public async leave() {
    if (this.room.state === 'disconnected') return;
    const channelId = this.currentChannelId();
    await this.room.disconnect();
    if (channelId) {
      this.socketService.syncVoice(channelId);
    }
  }

  public async toggleMute() {
    if (this.connectionState() !== 'connected') {
      this.isMuted.set(!this.isMuted());
      return;
    }
    const local = this.room.localParticipant;
    if (this.isMuted()) {
      // Unmute
      await local.setMicrophoneEnabled(true);
      this.isMuted.set(false);
    } else {
      // Mute
      await local.setMicrophoneEnabled(false);
      this.isMuted.set(true);
    }
  }

  public toggleDeafen() {
    const newDeafenedState = !this.isDeafened();
    this.isDeafened.set(newDeafenedState);
    this.applyDeafenState();

    if (newDeafenedState && !this.isMuted()) {
      this.toggleMute();
    }
  }

  private applyDeafenState() {
    const deafened = this.isDeafened();
    // Find all audio elements in our container and mute/unmute them locally
    const audioElements = this.audioContainer.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.muted = deafened;
    });
  }
}
