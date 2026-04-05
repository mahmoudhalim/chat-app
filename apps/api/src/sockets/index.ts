import { Server } from "socket.io";
import { extractBearerToken, verifyAccessToken } from "@middlewares/requireAuth";
import { Server as ServerModel } from "@models/serverModel";
import { Channel } from "@models/channelModel";
import { message } from "./events/chatHandler";

const onlineSocketsByUserId = new Map<string, Set<string>>();

const getOnlineUserIds = () => Array.from(onlineSocketsByUserId.keys());

const markUserOnline = (userId: string, socketId: string) => {
  const socketIds = onlineSocketsByUserId.get(userId) ?? new Set<string>();
  socketIds.add(socketId);
  onlineSocketsByUserId.set(userId, socketIds);
};

const markUserOffline = (userId: string, socketId: string) => {
  const socketIds = onlineSocketsByUserId.get(userId);
  if (!socketIds) {
    return;
  }

  socketIds.delete(socketId);

  if (socketIds.size === 0) {
    onlineSocketsByUserId.delete(userId);
  }
};

const emitOnlineMembers = (io: Server) => {
  const onlineUserIds = getOnlineUserIds();
  io.emit("members:online", {
    userIds: onlineUserIds,
    count: onlineUserIds.length,
  });
};

const joinUserChannels = async (socket: any) => {
  const userId = socket.data.userId as string | undefined;
  if (!userId) {
    return;
  }

  const servers = await ServerModel.find({
    $or: [{ "members.userId": userId }, { ownerId: userId }],
  }).select("_id");

  if (servers.length === 0) {
    return;
  }

  const serverIds = servers.map((server) => server._id);
  const channels = await Channel.find({ serverId: { $in: serverIds } }).select("_id");

  if (channels.length === 0) {
    return;
  }

  socket.join(channels.map((channel) => channel.id));
};

export const initSocket = (server: any) => {
  const io = new Server(server, {
    connectionStateRecovery: {},
    cors: {
      origin: "*",
    },
  });

  io.use((socket, next) => {
    const authToken = socket.handshake.auth.token ?? null;
    const bearerToken = extractBearerToken(socket.handshake.headers.authorization);
    const userId = verifyAccessToken(authToken ?? bearerToken ?? undefined);

    if (!userId) {
      next(new Error("Unauthorized"));
      return;
    }

    socket.data.userId = userId;
    next();
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId as string | undefined;
    if (userId) {
      markUserOnline(userId, socket.id);
      emitOnlineMembers(io);
      console.log(`user connected: ${userId}`);
    }

    message(socket);

    try {
      await joinUserChannels(socket);
    } catch (error) {
      console.log("failed to auto join channels", error);
    }

    socket.on("disconnect", () => {
      if (!userId) {
        return;
      }

      markUserOffline(userId, socket.id);
      emitOnlineMembers(io);
      console.log(`user disconnected: ${userId}`);
    });
  });

  return io;
};
