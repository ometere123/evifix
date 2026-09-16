import { describe, expect, it } from "vitest";
import { formatGen, parseGen } from "./escrow";

describe("GEN escrow amount handling", () => {
  it("converts decimal GEN exactly to atto-GEN", () => {
    expect(parseGen("0.001")).toBe(1_000_000_000_000_000n);
    expect(parseGen("1.000000000000000001")).toBe(1_000_000_000_000_000_001n);
  });

  it("rejects malformed or over-precise amounts", () => {
    expect(() => parseGen("0.0000000000000000001")).toThrow();
    expect(() => parseGen("-1")).toThrow();
    expect(() => parseGen("1e-3")).toThrow();
  });

  it("formats exact atto-GEN values without floating point", () => {
    expect(formatGen(1_000_000_000_000_000n)).toBe("0.001 GEN");
    expect(formatGen(1_000_000_000_000_000_001n)).toBe("1.000000000000000001 GEN");
  });
});
