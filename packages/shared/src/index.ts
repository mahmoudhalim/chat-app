// Shared types and utilities for the chat app

export type User = {
  id: string;
  username: string;
};

export type Message = {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: Date;
  editedAt?: Date;
};

export type ServerMember = {
  userId: string;
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

export type ChannelType = 'text' | 'voice' | 'video';

export type Channel = {
  id: string;
  serverId: string;
  name: string;
  type: ChannelType;
  createdAt: Date;
};
