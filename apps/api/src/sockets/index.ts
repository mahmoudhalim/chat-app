import { Server } from "socket.io";
import { extractBearerToken, verifyAccessToken } from "@middlewares/requireAuth";
import { Server as ServerModel } from "@models/serverModel";
import { Channel } from "@models/channelModel";
import { message } from "./events/chatHandler";

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
    console.log("a user connected");
    socket.emit("hello", "world");

    message(socket);

    try {
      await joinUserChannels(socket);
    } catch (error) {
      console.log("failed to auto join channels", error);
    }
  });

  return io;
};
