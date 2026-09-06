import { z } from "zod";

export const salesVoucherItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  rate: z.coerce.number().nonnegative(),
  gstRatePct: z.coerce.number().nonnegative().default(18),
});

export const salesVoucherSchema = z.object({
  companyId: z.string().min(1),
  partyId: z.string().min(1),
  date: z.string().min(1), // ISO date YYYY-MM-DD
  narration: z.string().optional(),
  isIntraState: z.boolean().default(true),
  placeOfSupply: z.string().optional(),
  items: z.array(salesVoucherItemSchema).min(1),
});

export type SalesVoucherInput = z.infer<typeof salesVoucherSchema>;
