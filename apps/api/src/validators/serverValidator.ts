import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().min(1, "Server name is required").max(100, "Server name is too long"),
});

export const joinServerSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export type CreateServerInput = z.infer<typeof createServerSchema>;
export type JoinServerInput = z.infer<typeof joinServerSchema>;
