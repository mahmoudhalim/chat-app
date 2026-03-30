import { Component, input } from '@angular/core';
import { ServerList } from './server-list/server-list';
import { ChannelList } from './channel-list/channel-list';
import { ChatArea } from './chat-area/chat-area';
import { MemberList } from './member-list/member-list';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ServerList, ChannelList, ChatArea, MemberList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  serverId = input<string>();
  channelId = input<string>();
}
