import type { ErrorRequestHandler } from "express";
import HttpError from "@utils/httpError";
import { isMongoCastError, isMongoDuplicateKeyError } from "@utils/mongoErrors";


const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  if (isMongoCastError(err)) {
    res.status(404).json({ message: "malformed id" });
    return;
  }
  if (isMongoDuplicateKeyError(err)) {
    const keyValue = err.keyValue as Record<string, unknown>
    const field = keyValue ? Object.keys(keyValue)[0] : undefined;
    res.status(409).json({
      message: field ? `Duplicate value for ${field}` : "Duplicate key error",
    });
    return;
  }
  res.status(500).json({ message: "Internal server error" });
};

export default errorHandler;
