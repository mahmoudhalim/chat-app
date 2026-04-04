import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length);
};

export const verifyAccessToken = (token?: string) => {
  console.log(token);
  if (!token) {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET as string;

  try {
    const payload = jwt.verify(token, jwtSecret) as { id?: string };
    return payload.id ?? null;
  } catch {
    return null;
  }
};

const requireAuth: RequestHandler = (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const userId = verifyAccessToken(token);

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  req.userId = userId;
  next();
};

export default requireAuth;
