import { User, type UserDocument } from "@models/userModel";
import HttpError from "@utils/httpError";
import { isMongoDuplicateKeyError } from "@utils/mongoErrors";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "@validators/userValidator";

const getAll = async (): Promise<UserDocument[]> => {
  const users = await User.find();
  return users;
};

const getById = async (id: string): Promise<UserDocument | null> => {
  const found = await User.findById(id);
  return found;
};

const create = async (data: CreateUserInput): Promise<UserDocument> => {
  try {
    const newUser = await User.create(data);
    return newUser;
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw new HttpError(409, "User already exists");
    }
    throw error;
  }
};

const update = async (
  id: string,
  data: UpdateUserInput,
): Promise<UserDocument | null> => {
  const existing = await User.findById(id);
  if (!existing) {
    return null;
  }

  if (data.email && data.email !== existing.email) {
    const emailOwner = await User.findOne({ email: data.email });
    if (emailOwner && emailOwner.id !== id) {
      throw new HttpError(409, "Email already in use");
    }
  }

  if (data.username && data.username !== existing.username) {
    const usernameOwner = await User.findOne({ username: data.username });
    if (usernameOwner && usernameOwner.id !== id) {
      throw new HttpError(409, "Username already in use");
    }
  }


  existing.set(data);

  try {
    const updated = await existing.save();
    return updated;
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw new HttpError(409, "User already exists");
    }
    throw error;
  }
};

const deleteById = async (id: string): Promise<UserDocument | null> => {
  const deleted = await User.findByIdAndDelete(id);
  return deleted;
};

export default {
  getAll,
  getById,
  create,
  update,
  deleteById,
};
