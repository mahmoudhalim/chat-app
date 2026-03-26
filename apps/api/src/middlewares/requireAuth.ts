import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  const jwtSecret = process.env.JWT_SECRET as string;

  try {
    const payload = jwt.verify(token, jwtSecret) as { id?: string };
    if (!payload.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    res.locals.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default requireAuth;
