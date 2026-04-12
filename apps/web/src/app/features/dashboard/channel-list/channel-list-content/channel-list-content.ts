import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { of } from 'rxjs';
import { ChannelAPI } from 'src/app/core/services/channel-api';
import { ServerAPI } from 'src/app/core/services/server-api';

@Component({
  selector: 'app-channel-list-content',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive],
  templateUrl: './channel-list-content.html',
  styleUrl: './channel-list-content.css',
})
export class ChannelListContent {
  serverId = input<string>();

  private readonly channelAPI = inject(ChannelAPI);
  private readonly serverAPI = inject(ServerAPI);

  protected channelResource = rxResource({
    params: () => this.serverId(),
    stream: ({ params: id }) => {
      if (!id) return of([]);
      return this.channelAPI.getChannelList(id);
    },
  });

  protected serverResource = rxResource({
    params: () => this.serverId(),
    stream: ({ params: id }) => {
      if (!id) return of(null);
      return this.serverAPI.getServer(id);
    },
  });
}
