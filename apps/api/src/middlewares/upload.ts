import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { RequestHandler } from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import { BadRequestError } from "@utils/customErrors";

const uploadsDir = fileURLToPath(new URL("../../uploads", import.meta.url));
fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `img-${randomUUID()}${extension || ".jpg"}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new BadRequestError("Only JPG, PNG, WEBP, and GIF images are allowed"));
      return;
    }

    callback(null, true);
  },
});

const uploadProfilePhoto: RequestHandler = (req, res, next) => {
  upload.single("profilePhoto")(req, res, (error: unknown) => {
    if (!error) {
      if (req.file) {
        req.body.profilePhoto = `/api/uploads/${req.file.filename}`;
      }
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new BadRequestError("Profile photo must be 5MB or smaller"));
      return;
    }

    if (error instanceof Error) {
      next(error);
      return;
    }

    next(new BadRequestError("Profile photo upload failed"));
  });
};

export default uploadProfilePhoto;
