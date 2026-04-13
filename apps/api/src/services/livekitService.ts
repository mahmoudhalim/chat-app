import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { User } from "@models/userModel";
import { Channel } from "@models/channelModel";
import { NotFoundError, BadRequestError } from "@utils/customErrors";

const getRoomServiceClient = () => {
  const wsUrl = process.env.LIVEKIT_WS_URL || "ws://localhost:7880";
  const httpUrl = wsUrl.replace("ws://", "http://").replace("wss://", "https://");
  return new RoomServiceClient(
    httpUrl,
    process.env.LIVEKIT_API_KEY || "devkey",
    process.env.LIVEKIT_API_SECRET || "secret"
  );
};

export const getParticipantsInRoom = async (channelId: string): Promise<string[]> => {
  const roomService = getRoomServiceClient();
  try {
    const participants = await roomService.listParticipants(channelId);
    return participants.map(p => p.identity);
  } catch (error) {
    // Usually means the room doesn't exist yet (no one joined)
    return [];
  }
};

const getVoiceToken = async (channelId: string, userId: string): Promise<string> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new NotFoundError("Channel not found");
  }
  
  if (channel.type !== "voice") {
    throw new BadRequestError("This is not a voice channel");
  }

  // Create a new token for the user to join the room
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY || "devkey",
    process.env.LIVEKIT_API_SECRET || "secret",
    {
      identity: user.id,
      name: user.username,
    }
  );

  at.addGrant({
    roomJoin: true,
    room: channelId,
    canPublishSources: [TrackSource.MICROPHONE],
    canSubscribe: true,
  });

  return await at.toJwt();
};

export default {
  getVoiceToken,
  getParticipantsInRoom,
};

