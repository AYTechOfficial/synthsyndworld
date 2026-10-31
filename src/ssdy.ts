// $SSDY — Synthsynd World token utilities.
// Live prices come from /api/ssdy (DexScreener proxy, 60s cached).
// If the feed is unreachable the UI falls back to LAST_SNAPSHOT constants.

export const SSDY = {
  symbol: "$SSDY",
  name: "Synthsynd World",
  mint: "5kkYSNkWgn6DCkTkPRbKKEZtmzVzVWXSR9R9PK5Ppump",
  mintShort: "5kkY…Ppump",
  pumpUrl: "https://pump.fun/coin/5kkYSNkWgn6DCkTkPRbKKEZtmzVzVWXSR9R9PK5Ppump",
} as const;

export interface SsdyData {
  priceUsd: number | null;
  marketCap: number | null;
  volume24h: number | null;
  liquidity: number | null;
  holders: number | null;
  change24h: number | null;
  txns24h: number | null;
  buys24h: number | null;
  sells24h: number | null;
  bonding: number | null; // percent
  live: boolean;
}

export const SSDY_FALLBACK: SsdyData = {
  priceUsd: 0.000009219,
  marketCap: 9219.7,
  volume24h: 10752,
  liquidity: 2450,
  holders: 54,
  change24h: 1.67,
  txns24h: 208,
  buys24h: 113,
  sells24h: 95,
  bonding: 61,
  live: false,
};

export async function fetchSsdy(): Promise<SsdyData> {
  try {
    const res = await fetch("/api/ssdy");
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return { ...SSDY_FALLBACK, ...data };
  } catch {
    return { ...SSDY_FALLBACK };
  }
}

export function fmtPrice(p: number | null | undefined): string {
  if (p == null) return "—";
  if (p >= 1) return "$" + p.toFixed(2);
  const zeros = Math.max(0, -Math.floor(Math.log10(Math.abs(p))) - 1);
  const decimals = Math.min(10, Math.max(6, zeros + 4));
  return "$" + p.toFixed(decimals);
}

export function fmtUsd(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(2) + "K";
  return "$" + v.toFixed(2);
}

export function fmtSigned(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}
