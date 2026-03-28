import { z } from "zod";

export const createChannelSchema = z.object({
  name: z.string().min(1, "Channel name is required").max(100, "Channel name is too long"),
  type: z.enum(["text", "voice", "video"]).optional().default("text"),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
