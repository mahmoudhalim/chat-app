import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { RequestHandler } from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import { BadRequestError } from "@utils/customErrors";

const uploadsDir = fileURLToPath(new URL("../../uploads/attachments", import.meta.url));
fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `att-${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new BadRequestError("Only JPG, PNG, WEBP, GIF images, and PDFs are allowed"));
      return;
    }

    callback(null, true);
  },
});

const uploadAttachmentMiddleware: RequestHandler = (req, res, next) => {
  upload.single("file")(req, res, (error: unknown) => {
    if (!error) {
      if (req.file) {
        req.body.fileUrl = `/api/uploads/attachments/${req.file.filename}`;
        req.body.fileType = req.file.mimetype === "application/pdf" ? "pdf" : "image";
        req.body.fileName = req.file.originalname;
      }
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new BadRequestError("Attachment must be 10MB or smaller"));
      return;
    }

    if (error instanceof Error) {
      next(error);
      return;
    }

    next(new BadRequestError("Attachment upload failed"));
  });
};

export default uploadAttachmentMiddleware;