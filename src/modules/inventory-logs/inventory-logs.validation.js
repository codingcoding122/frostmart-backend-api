import { z } from "zod";

export const inventoryLogQuerySchema = z.object({
  product_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const adjustInventorySchema = z.object({
  product_id: z.number().int().positive(),
  change_type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().positive(),
  description: z.string().min(3).max(255).optional().default("Manual adjustment"),
});
