import { z } from "zod";

export const purchaseVoucherItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  rate: z.coerce.number().nonnegative(),
  gstRatePct: z.coerce.number().nonnegative().default(18),
});

export const purchaseVoucherSchema = z.object({
  companyId: z.string().min(1),
  partyId: z.string().min(1),
  date: z.string().min(1),
  narration: z.string().optional(),
  isIntraState: z.boolean().default(true),
  placeOfSupply: z.string().optional(),
  godownId: z.string().optional(),
  items: z.array(purchaseVoucherItemSchema).min(1),
});

export type PurchaseVoucherInput = z.infer<typeof purchaseVoucherSchema>;
