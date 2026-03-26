import crypto from "crypto";
import { RefreshToken } from "@models/refreshTokenModel";
import { Types } from "mongoose";

type RotateTokenResult =
  | { status: "ok"; userId: Types.ObjectId; refreshToken: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "reuse_detected" };

const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateRawToken = (): string => {
  return crypto.randomBytes(40).toString("hex");
};

const refreshTokenExpiryDate = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
};

const issueRefreshToken = async (
  userId: string,
  familyId: string,
): Promise<string> => {
  const token = generateRawToken();
  const tokenHash = hashToken(token);

  await RefreshToken.create({
    tokenHash,
    user: new Types.ObjectId(userId),
    familyId,
    expiresAt: refreshTokenExpiryDate(),
  });

  return token;
};

const issueInitialToken = async (userId: string): Promise<string> => {
  const familyId = crypto.randomUUID();
  return issueRefreshToken(userId, familyId);
};

const revokeFamily = async (familyId: string): Promise<void> => {
  await RefreshToken.updateMany(
    { familyId, revokedAt: { $exists: false } },
    { revokedAt: new Date() },
  );
};

const rotateToken = async (token: string): Promise<RotateTokenResult> => {
  const tokenHash = hashToken(token);
  const current = await RefreshToken.findOne({ tokenHash });

  if (!current) {
    return { status: "invalid" };
  }

  if (current.revokedAt || current.usedAt || current.replacedByTokenHash) {
    await RefreshToken.updateOne(
      { _id: current.id, reuseDetectedAt: { $exists: false } },
      { reuseDetectedAt: new Date() },
    );
    await revokeFamily(current.familyId);
    return { status: "reuse_detected" };
  }

  if (current.expiresAt < new Date()) {
    await RefreshToken.updateOne(
      { _id: current.id },
      { revokedAt: new Date(), usedAt: new Date() },
    );
    return { status: "expired" };
  }

  const newRawToken = generateRawToken();
  const newTokenHash = hashToken(newRawToken);

  await RefreshToken.findByIdAndUpdate(current.id, {
    usedAt: new Date(),
    revokedAt: new Date(),
    replacedByTokenHash: newTokenHash,
  });

  await RefreshToken.create({
    tokenHash: newTokenHash,
    user: current.user,
    familyId: current.familyId,
    expiresAt: refreshTokenExpiryDate(),
  });

  return {
    status: "ok",
    userId: current.user,
    refreshToken: newRawToken,
  };
};

const revokeByRawToken = async (token: string): Promise<void> => {
  const tokenHash = hashToken(token);

  await RefreshToken.updateOne(
    { tokenHash, revokedAt: { $exists: false } },
    { revokedAt: new Date() },
  );
};

const deleteTokensByUserId = async (userId: string) => {
  await RefreshToken.deleteMany({ user: new Types.ObjectId(userId) });
};

export {
  issueInitialToken,
  rotateToken,
  revokeByRawToken,
  revokeFamily,
  deleteTokensByUserId,
};
