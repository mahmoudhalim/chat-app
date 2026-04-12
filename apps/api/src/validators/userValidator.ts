import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .regex(/^\S+$/, "Username cannot contain whitespace")
  .min(1, "Username cannot be empty");
const emailSchema = z
  .string()
  .trim()
  .refine((value) => z.email().safeParse(value).success, {
    message: "Invalid email address",
  });

const createUserSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .strict();

const updateUserSchema = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    profilePhoto: z.string().trim().optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export { createUserSchema, updateUserSchema };
export type { CreateUserInput, UpdateUserInput };
