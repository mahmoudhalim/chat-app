import { User, type UserDocument } from "@models/userModel";
import { ConflictError, NotFoundError } from "@utils/customErrors";
import { isMongoDuplicateKeyError } from "@utils/mongoErrors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "@validators/userValidator";

const uploadsDir = fileURLToPath(new URL("../../uploads", import.meta.url));

const getAll = async (): Promise<UserDocument[]> => {
  const users = await User.find();
  return users;
};

const getById = async (id: string): Promise<UserDocument> => {
  const found = await User.findById(id);
  if (!found) {
    throw new NotFoundError("User not found");
  }
  return found;
};

const create = async (data: CreateUserInput): Promise<UserDocument> => {
  try {
    const newUser = await User.create(data);
    return newUser;
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw new ConflictError("User already exists");
    }
    throw error;
  }
};

const update = async (
  id: string,
  data: UpdateUserInput,
): Promise<UserDocument> => {
  const existing = await User.findById(id);
  if (!existing) {
    throw new NotFoundError("User not found");
  }

  if (data.email && data.email !== existing.email) {
    const emailOwner = await User.findOne({ email: data.email });
    if (emailOwner && emailOwner.id !== id) {
      throw new ConflictError("Email already in use");
    }
  }

  if (data.username && data.username !== existing.username) {
    const usernameOwner = await User.findOne({ username: data.username });
    if (usernameOwner && usernameOwner.id !== id) {
      throw new ConflictError("Username already in use");
    }
  }

  if (data.profilePhoto && existing.profilePhoto && data.profilePhoto !== existing.profilePhoto) {
    if (existing.profilePhoto.startsWith("/api/uploads/")) {
      const filename = existing.profilePhoto.replace("/api/uploads/", "");
      const filePath = path.join(uploadsDir, filename);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error(`Failed to delete old profile photo: ${filePath}`, err);
      }
    }
  }

  existing.set(data);

  try {
    const updated = await existing.save();
    return updated;
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw new ConflictError("User already exists");
    }
    throw error;
  }
};

const deleteById = async (id: string): Promise<void> => {
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("User not found");
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  deleteById,
};
