import { describe, expect, it } from "vitest";
import { assertBalanced, nextVoucherNumber } from "./balance";

describe("assertBalanced", () => {
  it("accepts equal debit and credit totals", () => {
    const result = assertBalanced([
      { ledgerId: "a", debit: 1180, credit: 0 },
      { ledgerId: "b", debit: 0, credit: 1000 },
      { ledgerId: "c", debit: 0, credit: 180 },
    ]);
    expect(result.debitSum).toBe(1180);
    expect(result.creditSum).toBe(1180);
  });

  it("rejects unbalanced lines", () => {
    expect(() =>
      assertBalanced([
        { ledgerId: "a", debit: 100, credit: 0 },
        { ledgerId: "b", debit: 0, credit: 90 },
      ])
    ).toThrow(/Unbalanced/);
  });

  it("rejects single-line vouchers", () => {
    expect(() =>
      assertBalanced([{ ledgerId: "a", debit: 0, credit: 0 }])
    ).toThrow(/at least two/);
  });

  it("rejects lines with both debit and credit", () => {
    expect(() =>
      assertBalanced([
        { ledgerId: "a", debit: 50, credit: 50 },
        { ledgerId: "b", debit: 0, credit: 0 },
      ])
    ).toThrow(/both debit and credit/);
  });
});

describe("nextVoucherNumber", () => {
  it("pads sequential numbers", () => {
    expect(nextVoucherNumber(0)).toBe("0001");
    expect(nextVoucherNumber(11)).toBe("0012");
  });
});
