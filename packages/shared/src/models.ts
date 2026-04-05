// Shared types and utilities for the chat app

export type User = {
  id: string;
  username: string;
};

export type MessageDTO = {
  id: string;
  sender: string; 
  channel: string; 
  text: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type ServerMember = {
  userId: User;
  joinedAt: Date;
};

export type Server = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  members: ServerMember[];
  createdAt: Date;
};

export type ChannelType = "text" | "voice" | "video";

export type Channel = {
  id: string;
  serverId: string;
  name: string;
  type: ChannelType;
  createdAt: Date;
};
export interface ChannelResponse {
  channel: Channel;
  messages: MessageDTO[];
}
