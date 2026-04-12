import { Server, ServerDocument } from "@models/serverModel";
import { Channel } from "@models/channelModel";
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from "@utils/customErrors";
import crypto from "crypto";

const createServer = async (name: string, ownerId: string): Promise<ServerDocument> => {
  const inviteCode = crypto.randomBytes(8).toString("hex");

  const server = new Server({
    name,
    ownerId,
    inviteCode,
    members: [{ userId: ownerId }],
  });

  await server.save();

  // Create default text channel
  await Channel.create({
    serverId: server._id,
    name: "general",
    type: "text",
  });

  return server;
};

const getUserServers = async (userId: string): Promise<ServerDocument[]> => {
  return Server.find({ "members.userId": userId }).populate("ownerId", "username profilePhoto");
};

const getServerById = async (serverId: string): Promise<ServerDocument> => {
  const server = await Server.findById(serverId).populate("members.userId", "username profilePhoto");
  if (!server) {
    throw new NotFoundError("Server not found");
  }
  return server;
};

const joinServer = async (inviteCode: string, userId: string): Promise<ServerDocument> => {
  const server = await Server.findOne({ inviteCode });
  if (!server) {
    throw new NotFoundError("Invalid invite code");
  }

  const isMember = server.members.some((m) => m.userId.toString() === userId);
  if (isMember) {
    throw new ConflictError("Already a member");
  }

  server.members.push({ userId: userId as any, joinedAt: new Date() });
  await server.save();
  return server;
};

const leaveServer = async (serverId: string, userId: string): Promise<void> => {
  const server = await Server.findById(serverId);
  if (!server) {
    throw new NotFoundError("Server not found");
  }

  if (server.ownerId.toString() === userId) {
    throw new BadRequestError("Owner cannot leave the server, delete it instead.");
  }

  server.members = server.members.filter((m) => m.userId.toString() !== userId);
  await server.save();
};

const deleteServer = async (serverId: string, userId: string): Promise<void> => {
  const server = await Server.findById(serverId);
  if (!server) {
    throw new NotFoundError("Server not found");
  }
  if (server.ownerId.toString() !== userId) {
    throw new ForbiddenError("Not authorized to delete this server");
  }

  await Channel.deleteMany({ serverId });
  await Server.deleteOne({ _id: serverId });
};

export default {
  createServer,
  getUserServers,
  getServerById,
  joinServer,
  leaveServer,
  deleteServer,
};
