import { describe, expect, it } from "vitest";
import { toCsv } from "./gstr-reports";

describe("toCsv", () => {
  it("serializes simple rows", () => {
    const csv = toCsv([
      { invoice: "0001", taxable: 1000, igst: 180 },
      { invoice: "0002", taxable: 500, igst: 90 },
    ]);
    expect(csv).toContain("invoice,taxable,igst");
    expect(csv).toContain("0001,1000,180");
  });

  it("escapes commas and quotes", () => {
    const csv = toCsv([{ name: 'Acme, "Pvt"', amount: 10 }]);
    expect(csv).toContain('"Acme, ""Pvt"""');
  });

  it("returns empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });
});
