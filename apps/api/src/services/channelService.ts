import { Channel, ChannelDocument } from "@models/channelModel";
import { Message, MessageDocument } from "@models/messageModel";
import { Server } from "@models/serverModel";
import { NotFoundError, ForbiddenError } from "@utils/customErrors";

const createChannel = async (serverId: string, ownerId: string, name: string, type: "text" | "voice" | "video"): Promise<ChannelDocument> => {
  const server = await Server.findOne({ _id: serverId, ownerId });
  if (!server) {
    throw new ForbiddenError("Server not found or you don't have permission");
  }

  const channel = new Channel({
    serverId,
    name,
    type,
  });

  await channel.save();
  return channel;
};

const getServerChannels = async (serverId: string, userId: string): Promise<ChannelDocument[]> => {
  const server = await Server.findOne({
    _id: serverId,
    "members.userId": userId,
  });

  if (!server) {
    throw new ForbiddenError("Server not found or you don't have permission");
  }

  return Channel.find({ serverId });
};

const ensureChannelAccess = async (channel: ChannelDocument, userId: string): Promise<void> => {
  const server = await Server.findOne({
    _id: channel.serverId,
    "members.userId": userId,
  });

  if (!server) {
    throw new ForbiddenError("You do not have access to this channel");
  }
};

const getChannelById = async (channelId: string, userId: string): Promise<ChannelDocument> => {
  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new NotFoundError("Channel not found");
  }

  await ensureChannelAccess(channel, userId);
  
  return channel;
};

const updateChannel = async (channelId: string, userId: string, name: string): Promise<ChannelDocument> => {
  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new NotFoundError("Channel not found");
  }

  const server = await Server.findOne({ _id: channel.serverId, ownerId: userId });
  if (!server) {
    throw new ForbiddenError("Server not found or you don't have permission");
  }

  channel.name = name;
  await channel.save();
  return channel;
};

const deleteChannel = async (channelId: string, userId: string): Promise<void> => {
  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new NotFoundError("Channel not found");
  }

  const server = await Server.findOne({ _id: channel.serverId, ownerId: userId });
  if (!server) {
    throw new ForbiddenError("Server not found or you don't have permission");
  }

  await Channel.deleteOne({ _id: channelId });
};

const getAllMessages = async (channelId: string, userId: string): Promise<MessageDocument[]> => {
  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new NotFoundError("Channel not found");
  }

  await ensureChannelAccess(channel, userId);

  const messages = await Message.find({ channel: channelId }).populate("sender").sort({ createdAt: 1 });

  return messages;
}

export default {
  createChannel,
  updateChannel,
  getServerChannels,
  getChannelById,
  deleteChannel,
  getAllMessages
};
