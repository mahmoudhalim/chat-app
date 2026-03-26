import type { RequestHandler } from "express";
import type { z } from "zod";

const validateBody = (schema: z.ZodSchema): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        message: "Validation failed",
        errors,
      });
      return;
    }

    req.body = parsed.data;
    next();
  };
};

export default validateBody;
