import { z } from "zod";

export const updateTransactionStatusSchema = z.object({
  payment_status: z.enum(["pending", "paid", "failed", "refunded"]),
});
