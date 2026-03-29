import { Router } from "express";
import serverController from "@controllers/serverController";
import requireAuth from "@middlewares/requireAuth";
import validateBody from "@middlewares/validateBody";
import { createServerSchema, joinServerSchema } from "@validators/serverValidator";

const serverRouter = Router();


serverRouter.post("/", requireAuth, validateBody(createServerSchema), serverController.createServer);
serverRouter.get("/", requireAuth, serverController.getUserServers);
serverRouter.get("/:id", serverController.getServerById); 
serverRouter.post("/join", requireAuth, validateBody(joinServerSchema), serverController.joinServer);
serverRouter.post("/:id/leave", requireAuth, serverController.leaveServer);
serverRouter.delete("/:id", requireAuth, serverController.deleteServer);

export default serverRouter;
