import { Channel, ChannelDocument } from "@models/channelModel";
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

const getServerChannels = async (serverId: string): Promise<ChannelDocument[]> => {
  return Channel.find({ serverId });
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

export default {
  createChannel,
  getServerChannels,
  deleteChannel,
};
