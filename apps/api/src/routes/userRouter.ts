import { Router } from "express"
import userController from "@controllers/userController";
import validateBody from "../middlewares/validateBody";
import { createUserSchema, updateUserSchema } from "../validators/userValidator";
import uploadProfilePhoto from "@middlewares/upload";

const userRouter = Router()

userRouter.get("/", userController.getAll);
userRouter.get("/:id", userController.getById);
userRouter.post("/", validateBody(createUserSchema), userController.create);
userRouter.put("/:id", uploadProfilePhoto, validateBody(updateUserSchema), userController.update);
userRouter.delete("/:id", userController.deleteById);

export default userRouter
