import jwt from "jsonwebtoken";
import { User, type UserDocument } from "@models/userModel";
import { UnauthorizedError } from "@utils/customErrors";
import {
  issueInitialToken,
  rotateToken,
  revokeByRawToken,
  deleteTokensByUserId,
} from "@services/refreshTokenService";

type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  user: UserDocument;
};

const createAccessToken = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET as string;
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: "15m" });
};

const login = async (username: string, password: string) => {
  const user = (await User.findOne({ username })) as UserDocument | null;
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid credentials");
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
  
  if (rotated.status === "invalid" || rotated.status === "expired") {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
  
  if (rotated.status === "reuse_detected") {
    throw new UnauthorizedError("Refresh token reuse detected. Please log in again.");
  }

  const userId = rotated.userId;

  const user = (await User.findById(userId)) as UserDocument | null;
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  const accessToken = createAccessToken(user.id);
  const refreshToken = rotated.refreshToken;

  return {
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
