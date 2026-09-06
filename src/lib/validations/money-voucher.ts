import { z } from "zod";

export const paymentReceiptSchema = z.object({
  companyId: z.string().min(1),
  partyId: z.string().min(1),
  date: z.string().min(1),
  amount: z.coerce.number().positive(),
  cashLedgerId: z.string().min(1),
  narration: z.string().optional(),
});

export type PaymentReceiptInput = z.infer<typeof paymentReceiptSchema>;

export const journalLineSchema = z.object({
  ledgerId: z.string().min(1),
  debit: z.coerce.number().nonnegative().default(0),
  credit: z.coerce.number().nonnegative().default(0),
  narration: z.string().optional(),
});

export const journalVoucherSchema = z.object({
  companyId: z.string().min(1),
  date: z.string().min(1),
  narration: z.string().optional(),
  lines: z.array(journalLineSchema).min(2),
});

export type JournalVoucherInput = z.infer<typeof journalVoucherSchema>;
