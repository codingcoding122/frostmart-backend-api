import * as z from "zod";

export const createProductSchema = z.object({
  name: z.string().min(3, "Name is required min. 3 chars!"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0!"),
  stock: z.number().int().min(0, "Stock must be zero or greater!"),
});

export const updateProductSchema = z.object({
  name: z.string().min(3, "Name is required min. 3 chars!"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0!"),
  stock: z.number().int().min(0, "Stock must be zero or greater!"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
});
