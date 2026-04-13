import { type RequestHandler } from "express";
import channelService from "@services/channelService";
import livekitService from "@services/livekitService";
import type { CreateChannelInput } from "@validators/channelValidator";

const createChannel: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const serverId = req.params.serverId as string;
  const { name, type } = req.body as CreateChannelInput;

  const channel = await channelService.createChannel(serverId, userId, name, type);
  return res.status(201).json({ channel });
};

const getServerChannels: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const serverId = req.params.serverId as string;
  const channels = await channelService.getServerChannels(serverId, userId);
  
  const channelsWithVoiceStates = await Promise.all(channels.map(async (c: any) => {
    const channelJson = c.toJSON ? c.toJSON() : c;
    if (channelJson.type === "voice") {
      channelJson.voiceParticipants = await livekitService.getParticipantsInRoom(channelJson.id.toString());
    }
    return channelJson;
  }));

  return res.status(200).json({ channels: channelsWithVoiceStates });
};

const getChannelById: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const channelId = req.params.id as string;
  const channel = await channelService.getChannelById(channelId, userId);
  const messages = await channelService.getAllMessages(channelId, userId);
  return res.status(200).json({ channel, messages });
};

const deleteChannel: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const channelId = req.params.id as string;

  await channelService.deleteChannel(channelId, userId);
  return res.status(200).json({ message: "Channel deleted successfully" });
};

const getVoiceToken: RequestHandler = async (req, res) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const channelId = req.params.id as string;
    const token = await livekitService.getVoiceToken(channelId, userId);
    
    return res.status(200).json({ token, wsUrl: process.env.LIVEKIT_WS_URL || "ws://localhost:7880" });
};

export default {
  createChannel,
  getServerChannels,
  getChannelById,
  deleteChannel,
  getVoiceToken,
};

