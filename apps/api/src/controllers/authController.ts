import { type RequestHandler } from "express";
import authService from "@services/authService";
import type { LoginInput } from "@validators/authValidator";

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const login: RequestHandler = async (req, res) => {
  const { username, password } = req.body as LoginInput;

  const { accessToken, refreshToken, user } = await authService.login(username, password);

  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return res.status(200).json({
    message: "Login successful",
    accessToken,
    user,
  });
};

const refresh: RequestHandler = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const refreshed = await authService.refresh(refreshToken);
    
    res.cookie("refreshToken", refreshed.refreshToken, refreshTokenCookieOptions);

    return res.status(200).json({
      message: "Token refreshed",
      accessToken: refreshed.accessToken,
      user: refreshed.user,
    });
  } catch (error) {
    res.clearCookie("refreshToken", refreshTokenCookieOptions);
    next(error);
    return;
  }
};

const logout: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.clearCookie("refreshToken", refreshTokenCookieOptions);
  return res.status(200).json({ message: "Logged out" });
};

const logoutAll: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await authService.logoutAll(userId);
  res.clearCookie("refreshToken", refreshTokenCookieOptions);
  return res.status(200).json({ message: "Logged out from all sessions" });
};

const authController = { login, refresh, logout, logoutAll };
export default authController;
