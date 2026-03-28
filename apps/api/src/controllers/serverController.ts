import { type RequestHandler } from "express";
import serverService from "@services/serverService";
import type { CreateServerInput, JoinServerInput } from "@validators/serverValidator";

const createServer: RequestHandler = async (req, res) => {
  const userId = res.locals.userId as string;
  const { name } = req.body as CreateServerInput;

  const server = await serverService.createServer(name, userId);
  return res.status(201).json({ server });
};

const getUserServers: RequestHandler = async (_req, res) => {
  const userId = res.locals.userId as string;
  const servers = await serverService.getUserServers(userId);
  return res.status(200).json({ servers });
};

const getServerById: RequestHandler = async (req, res) => {
  const serverId = req.params.id as string;
  const server = await serverService.getServerById(serverId);
  return res.status(200).json({ server });
};

const joinServer: RequestHandler = async (req, res) => {
  const userId = res.locals.userId as string;
  const { inviteCode } = req.body as JoinServerInput;

  const server = await serverService.joinServer(inviteCode, userId);
  return res.status(200).json({ server });
};

const leaveServer: RequestHandler = async (req, res) => {
  const userId = res.locals.userId as string;
  const serverId = req.params.id as string;

  await serverService.leaveServer(serverId, userId);
  return res.status(200).json({ message: "Left server successfully" });
};

const deleteServer: RequestHandler = async (req, res) => {
  const userId = res.locals.userId as string;
  const serverId = req.params.id as string;

  await serverService.deleteServer(serverId, userId);
  return res.status(200).json({ message: "Server deleted successfully" });
};

export default {
  createServer,
  getUserServers,
  getServerById,
  joinServer,
  leaveServer,
  deleteServer,
};
