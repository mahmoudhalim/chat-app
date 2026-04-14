import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Server } from '@shared/models';
import { map, Observable } from 'rxjs';

interface ServerResponse {
  servers: Server[];
}

@Injectable({
  providedIn: 'root',
})
export class ServerAPI {
  private readonly http = inject(HttpClient);
  
  public servers = signal<Server[]>([]);

  getServerList(): Observable<Server[]> {
    return this.http.get<ServerResponse>('/api/servers').pipe(
      map(response => response.servers)
    );
  }
  getServer(id: string): Observable<Server> {
    return this.http.get<{ server: Server }>(`/api/servers/${id}`).pipe(
      map(response => response.server)
    );
  }

  createServer(name: string): Observable<Server> {
    return this.http.post<{ server: Server }>('/api/servers', { name }).pipe(
      map(response => response.server)
    );
  }

  joinServer(inviteCode: string): Observable<Server> {
    return this.http.post<{ server: Server }>('/api/servers/join', { inviteCode }).pipe(
      map(response => response.server)
    );
  }

  leaveServer(serverId: string): Observable<void> {
    return this.http.post<void>(`/api/servers/${serverId}/leave`, {});
  }

  deleteServer(serverId: string): Observable<void> {
    return this.http.delete<void>(`/api/servers/${serverId}`);
  }
}
