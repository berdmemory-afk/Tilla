import { Prisma } from "@prisma/client";
import { round2 } from "@/lib/tax/gst";

export function d(n: number): Prisma.Decimal {
  return new Prisma.Decimal(round2(n).toFixed(2));
}
