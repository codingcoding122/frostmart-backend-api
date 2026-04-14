import { z } from "zod";

export const usersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "user"]),
});
