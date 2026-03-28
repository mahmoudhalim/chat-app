import type { ErrorRequestHandler } from "express";
import {
  DomainError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
  UnauthorizedError,
} from "@utils/customErrors";
import { isMongoCastError, isMongoDuplicateKeyError } from "@utils/mongoErrors";


const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  
  if (err instanceof DomainError) {
    let statusCode = 400;
    if (err instanceof NotFoundError) statusCode = 404;
    else if (err instanceof ConflictError) statusCode = 409;
    else if (err instanceof ForbiddenError) statusCode = 403;
    else if (err instanceof UnauthorizedError) statusCode = 401;
    else if (err instanceof BadRequestError) statusCode = 400;

    res.status(statusCode).json({ message: err.message });
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
