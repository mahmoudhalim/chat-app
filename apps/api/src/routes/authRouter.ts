import { Router } from "express";
import authController from "@controllers/authController";
import validateBody from "../middlewares/validateBody";
import requireAuth from "@middlewares/requireAuth";
import { loginSchema } from "@validators/authValidator";

const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post("/logout-all", requireAuth, authController.logoutAll);

export default authRouter;
