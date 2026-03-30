import { Router } from "express";
import channelController from "@controllers/channelController";
import requireAuth from "@middlewares/requireAuth";

const channelRouter = Router();

channelRouter.use(requireAuth);

channelRouter.delete("/:id", channelController.deleteChannel);

export default channelRouter;
