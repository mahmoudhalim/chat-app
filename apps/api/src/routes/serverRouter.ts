import { Router } from "express";
import serverController from "@controllers/serverController";
import channelController from "@controllers/channelController";
import requireAuth from "@middlewares/requireAuth";
import validateBody from "@middlewares/validateBody";
import { createServerSchema, joinServerSchema } from "@validators/serverValidator";
import { createChannelSchema } from "@validators/channelValidator";

const serverRouter = Router();


serverRouter.post("/", requireAuth, validateBody(createServerSchema), serverController.createServer);
serverRouter.get("/", requireAuth, serverController.getUserServers);
serverRouter.get("/:id", serverController.getServerById); 
serverRouter.post("/join", requireAuth, validateBody(joinServerSchema), serverController.joinServer);
serverRouter.post("/:id/leave", requireAuth, serverController.leaveServer);
serverRouter.delete("/:id", requireAuth, serverController.deleteServer);

serverRouter.post("/:serverId/channels", requireAuth, validateBody(createChannelSchema), channelController.createChannel);
serverRouter.get("/:serverId/channels", requireAuth, channelController.getServerChannels);

export default serverRouter;
