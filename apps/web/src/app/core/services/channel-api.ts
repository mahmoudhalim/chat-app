import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Channel } from '@shared/models';
import { map, Observable, tap } from 'rxjs';

interface ChannelResponse {
  channels: Channel[];
}


@Injectable({
  providedIn: 'root',
})
export class ChannelAPI {
  private readonly http = inject(HttpClient);

  getChannelList(serverId: string): Observable<Channel[]> {
    console.log('serverId', serverId);
    return this.http.get<ChannelResponse>(`/api/servers/${serverId}/channels`).pipe(
      map(response => response.channels),
      tap(console.log)
    );
  }

}
