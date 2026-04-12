import { Component, input } from '@angular/core';
import { ChannelListContent } from './channel-list-content/channel-list-content';
import { ChannelUserControls } from './channel-user-controls/channel-user-controls';

@Component({
  selector: 'app-channel-list',
  imports: [ChannelListContent, ChannelUserControls],
  templateUrl: './channel-list.html',
  styleUrl: './channel-list.css',
})
export class ChannelList {
  serverId = input<string>();
}
