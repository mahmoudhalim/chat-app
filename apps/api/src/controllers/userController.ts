import userService from "@services/userService";
import type { Request, Response } from "express";
import type { CreateUserInput, UpdateUserInput } from "../validators/userValidator";

const getAll = async (_req: Request, res: Response) => {
  const users = await userService.getAll();
  res.json(users);
}

const getById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = await userService.getById(id);
  res.json(user);
}

const create = async (req: Request, res: Response) => {
  const data = req.body as CreateUserInput;
  const user = await userService.create(data);
  res.status(201).json(user);
}

const update = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body as UpdateUserInput;
  const user = await userService.update(id, data);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(user);
}

const deleteById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await userService.deleteById(id);
  res.status(204).end();
}

export default {
  getAll,
  getById,
  create,
  update,
  deleteById
}