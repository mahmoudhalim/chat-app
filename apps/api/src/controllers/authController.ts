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

  const loginResult = await authService.login(username, password);
  if (!loginResult) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const { accessToken, refreshToken, user } = loginResult;

  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return res.status(200).json({
    message: "Login successful",
    accessToken,
    user,
  });
};

const refresh: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  const refreshed = await authService.refresh(refreshToken);
  if (refreshed.status === "invalid" || refreshed.status === "expired") {
    res.clearCookie("refreshToken", refreshTokenCookieOptions);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }

  if (refreshed.status === "reuse_detected") {
    res.clearCookie("refreshToken", refreshTokenCookieOptions);
    return res.status(401).json({
      message: "Refresh token reuse detected. Please log in again.",
    });
  }

  res.cookie("refreshToken", refreshed.refreshToken, refreshTokenCookieOptions);

  return res.status(200).json({
    message: "Token refreshed",
    accessToken: refreshed.accessToken,
    user: refreshed.user,
  });
};

const logout: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.clearCookie("refreshToken", refreshTokenCookieOptions);
  return res.status(200).json({ message: "Logged out" });
};

const logoutAll: RequestHandler = async (_req, res) => {
  const userId = res.locals.userId as string;
  await authService.logoutAll(userId);
  res.clearCookie("refreshToken", refreshTokenCookieOptions);
  return res.status(200).json({ message: "Logged out from all sessions" });
};

const authController = { login, refresh, logout, logoutAll };
export default authController;
