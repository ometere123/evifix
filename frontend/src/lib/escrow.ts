const ATTO_GEN = 1_000_000_000_000_000_000n;

export function parseGen(value: string): bigint {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(trimmed)) {
    throw new Error("Enter a valid GEN amount with at most 18 decimals.");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  return BigInt(whole) * ATTO_GEN + BigInt(fraction.padEnd(18, "0") || "0");
}

export function formatGen(value: bigint): string {
  const whole = value / ATTO_GEN;
  const fraction = (value % ATTO_GEN).toString().padStart(18, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction} GEN` : `${whole} GEN`;
}
