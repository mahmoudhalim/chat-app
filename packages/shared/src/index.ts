// Shared types and utilities for the chat app

export type User = {
  id: string;
  username: string;
};

export type Message = {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
};
