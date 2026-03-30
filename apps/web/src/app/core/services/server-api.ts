import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
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

}
