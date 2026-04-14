import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Channel, ChannelResponse, MessageDTO } from '@shared/models';
import { map, Observable } from 'rxjs';
import { normalizeMessageDates } from 'src/app/core/utils/message-date';



@Injectable({
  providedIn: 'root',
})
export class ChannelAPI {
  private readonly http = inject(HttpClient);

  getChannelList(serverId: string): Observable<Channel[]> {
    return this.http.get<{ channels: Channel[] }>(`/api/servers/${serverId}/channels`).pipe(
      map(response => response.channels),
    );
  }

  getMessages(id: string): Observable<ChannelResponse> {
    return this.http.get<ChannelResponse>(`/api/channels/${id}`).pipe(
      map(response => ({
        ...response,
        messages: response.messages.map((message: MessageDTO) => normalizeMessageDates(message)),
      }))
    );
  }

  createChannel(serverId: string, name: string, type: 'text' | 'voice'): Observable<Channel> {
    return this.http.post<{ channel: Channel }>(`/api/servers/${serverId}/channels`, { name, type }).pipe(
      map(response => response.channel)
    );
  }

  updateChannel(channelId: string, name: string): Observable<Channel> {
    return this.http.put<{ channel: Channel }>(`/api/channels/${channelId}`, { name }).pipe(
      map(response => response.channel)
    );
  }

  deleteChannel(channelId: string): Observable<void> {
    return this.http.delete<void>(`/api/channels/${channelId}`);
  }
}
