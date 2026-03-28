import { type RequestHandler } from "express";
import channelService from "@services/channelService";
import type { CreateChannelInput } from "@validators/channelValidator";

const createChannel: RequestHandler = async (req, res) => {
  const userId = res.locals.userId as string;
  const serverId = req.params.serverId as string;
  const { name, type } = req.body as CreateChannelInput;

  const channel = await channelService.createChannel(serverId, userId, name, type);
  return res.status(201).json({ channel });
};

const getServerChannels: RequestHandler = async (req, res) => {
  const serverId = req.params.serverId as string;
  const channels = await channelService.getServerChannels(serverId);
  return res.status(200).json({ channels });
};

const deleteChannel: RequestHandler = async (req, res) => {
  const userId = res.locals.userId as string;
  const channelId = req.params.id as string;

  await channelService.deleteChannel(channelId, userId);
  return res.status(200).json({ message: "Channel deleted successfully" });
};

export default {
  createChannel,
  getServerChannels,
  deleteChannel,
};
