import { describe, expect, it } from "vitest";
import { computeGst, halfRate, invoiceTotal, round2 } from "./gst";

describe("computeGst — intra-state (CGST + SGST)", () => {
  it("splits 18% GST equally into CGST and SGST", () => {
    const split = computeGst(1000, 18, true);
    expect(split.kind).toBe("intra");
    expect(split.cgst).toBe(90);
    expect(split.sgst).toBe(90);
    expect(split.igst).toBe(0);
    expect(split.totalTax).toBe(180);
  });

  it("handles odd paisa so CGST+SGST equals total tax", () => {
    // 100 * 18% = 18; half = 9 each
    const split = computeGst(100, 18, true);
    expect(split.cgst + split.sgst).toBe(split.totalTax);
    expect(split.igst).toBe(0);
  });

  it("works for 5% rate", () => {
    const split = computeGst(200, 5, true);
    expect(split.cgst).toBe(5);
    expect(split.sgst).toBe(5);
    expect(split.totalTax).toBe(10);
  });

  it("works for 12% rate", () => {
    const split = computeGst(500, 12, true);
    expect(split.cgst).toBe(30);
    expect(split.sgst).toBe(30);
    expect(split.igst).toBe(0);
  });
});

describe("computeGst — inter-state (IGST)", () => {
  it("applies full rate as IGST with zero CGST/SGST", () => {
    const split = computeGst(1000, 18, false);
    expect(split.kind).toBe("inter");
    expect(split.igst).toBe(180);
    expect(split.cgst).toBe(0);
    expect(split.sgst).toBe(0);
    expect(split.totalTax).toBe(180);
  });

  it("does not leak CGST/SGST on inter-state", () => {
    const split = computeGst(2500, 28, false);
    expect(split.cgst).toBe(0);
    expect(split.sgst).toBe(0);
    expect(split.igst).toBe(700);
  });
});

describe("invoiceTotal and helpers", () => {
  it("adds tax to taxable for grand total", () => {
    const split = computeGst(1000, 18, true);
    expect(invoiceTotal(1000, split)).toBe(1180);
  });

  it("halfRate returns half of GST %", () => {
    expect(halfRate(18)).toBe(9);
    expect(halfRate(5)).toBe(2.5);
  });

  it("round2 rounds to paisa", () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10.004)).toBe(10);
  });

  it("rejects negative taxable amount", () => {
    expect(() => computeGst(-1, 18, true)).toThrow();
  });
});
