import type { ErrorRequestHandler } from "express";
import HttpError from "@utils/httpError";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  res.status(500).json({ message: "Internal server error" });
};

export default errorHandler;
