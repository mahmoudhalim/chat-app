import { z } from "zod";

const loginSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

type LoginInput = z.infer<typeof loginSchema>;

export { loginSchema };
export type { LoginInput };
