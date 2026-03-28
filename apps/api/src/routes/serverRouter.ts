import { Router } from "express";
import serverController from "@controllers/serverController";
import requireAuth from "@middlewares/requireAuth";
import validateBody from "@middlewares/validateBody";
import { createServerSchema, joinServerSchema } from "@validators/serverValidator";

const serverRouter = Router();

serverRouter.use(requireAuth);

serverRouter.post("/", validateBody(createServerSchema), serverController.createServer);
serverRouter.get("/", serverController.getUserServers);
serverRouter.get("/:id", serverController.getServerById);
serverRouter.post("/join", validateBody(joinServerSchema), serverController.joinServer);
serverRouter.post("/:id/leave", serverController.leaveServer);
serverRouter.delete("/:id", serverController.deleteServer);

export default serverRouter;
