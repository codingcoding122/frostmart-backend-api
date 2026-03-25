import * as z from "zod";

export const createMenuSchema = z.object({
  name: z.string().min(3, "Name is required min. 3 chars!"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0!"),
});

export const updateMenuSchema = z.object({
  name: z.string().min(3, "Name is required min. 3 chars!"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0!"),
  is_available: z.boolean().default(true),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});
