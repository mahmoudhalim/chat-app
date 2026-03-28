import { Router } from "express";
import channelController from "@controllers/channelController";
import requireAuth from "@middlewares/requireAuth";
import validateBody from "@middlewares/validateBody";
import { createChannelSchema } from "@validators/channelValidator";

const channelRouter = Router();

channelRouter.use(requireAuth);

channelRouter.post("/server/:serverId", validateBody(createChannelSchema), channelController.createChannel);
channelRouter.get("/server/:serverId", channelController.getServerChannels);
channelRouter.delete("/:id", channelController.deleteChannel);

export default channelRouter;
