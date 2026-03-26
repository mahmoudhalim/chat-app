import jwt from "jsonwebtoken";
import { User } from "@models/userModel";
import { UserDocument } from "@models/userModel";
import {
  issueInitialToken,
  rotateToken,
  revokeByRawToken,
  deleteTokensByUserId,
} from "@services/refreshTokenService";

type RefreshResult =
  | {
      status: "ok";
      accessToken: string;
      refreshToken: string;
      user: UserDocument;
    }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "reuse_detected" };

const createAccessToken = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET as string;
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: "15m" });
};

const login = async (username: string, password: string) => {
  const user = (await User.findOne({ username })) as UserDocument | null;
  if (!user) {
    return null;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return null;
  }

  const accessToken = createAccessToken(user.id);
  const refreshToken = await issueInitialToken(user.id);

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const refresh = async (token: string): Promise<RefreshResult> => {
  const rotated = await rotateToken(token);
  if (rotated.status !== "ok") {
    return rotated;
  }

  const userId = rotated.userId;

  const user = (await User.findById(userId)) as UserDocument | null;
  if (!user) {
    return { status: "invalid" };
  }

  const accessToken = createAccessToken(user.id);
  const refreshToken = rotated.refreshToken;

  return {
    status: "ok",
    accessToken,
    refreshToken,
    user,
  };
};

const logout = async (refreshToken: string): Promise<void> => {
  await revokeByRawToken(refreshToken);
};

const logoutAll = async (userId: string): Promise<void> => {
  await deleteTokensByUserId(userId);
};

const authService = { login, refresh, logout, logoutAll };
export default authService;
