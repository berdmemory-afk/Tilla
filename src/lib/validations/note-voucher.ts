import { z } from "zod";

export const noteVoucherItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  rate: z.coerce.number().nonnegative(),
  gstRatePct: z.coerce.number().nonnegative().default(18),
});

/** Credit Note = sales return; Debit Note = purchase return. */
export const noteVoucherSchema = z.object({
  companyId: z.string().min(1),
  partyId: z.string().min(1),
  date: z.string().min(1),
  narration: z.string().optional(),
  isIntraState: z.boolean().default(true),
  placeOfSupply: z.string().optional(),
  godownId: z.string().optional(),
  againstVoucherId: z.string().optional(),
  items: z.array(noteVoucherItemSchema).min(1),
});

export type NoteVoucherInput = z.infer<typeof noteVoucherSchema>;
