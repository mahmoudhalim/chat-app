import { Document, Schema, Types, model } from "mongoose";

export interface RefreshTokenDocument extends Document {
  tokenHash: string;
  user: Types.ObjectId;
  familyId: string;
  replacedByTokenHash?: string;
  revokedAt?: Date;
  usedAt?: Date;
  reuseDetectedAt?: Date;
  expiresAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    replacedByTokenHash: {
      type: String,
    },
    revokedAt: {
      type: Date,
    },
    usedAt: {
      type: Date,
    },
    reuseDetectedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  { timestamps: true },
);

export const RefreshToken = model<RefreshTokenDocument>("RefreshToken", refreshTokenSchema);
