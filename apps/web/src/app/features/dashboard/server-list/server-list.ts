import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Server } from '@shared/models';
import { ServerAPI } from 'src/app/core/services/server-api';

@Component({
  selector: 'app-server-list',
  imports: [RouterLink],
  templateUrl: './server-list.html',
  styleUrl: './server-list.css',
})
export class ServerList implements OnInit {
  private readonly serverAPI = inject(ServerAPI);
  protected servers = signal<Server[]>([]);

  ngOnInit(): void {
    this.serverAPI.getServerList().subscribe((servers) => {
      this.servers.set(servers)
    });
  }
}
