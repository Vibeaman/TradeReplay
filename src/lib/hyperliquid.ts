import type { HlClearinghouse, HlFill, PortfolioBucket } from "./types";

const INFO = "https://api.hyperliquid.xyz/info";

async function info<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(INFO, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Hyperliquid ${res.status}: ${text.slice(0, 180)}`);
  }
  return (await res.json()) as T;
}

export function normalizeAddress(raw: string): string {
  const s = raw.trim();
  if (!s) throw new Error("Missing address");
  const hex = s.startsWith("0x") ? s : `0x${s}`;
  if (!/^0x[a-fA-F0-9]{40}$/.test(hex)) {
    throw new Error("Use the Hyperliquid account address (0x + 40 hex). Not an agent wallet.");
  }
  return hex.toLowerCase();
}

export async function fetchUserFills(user: string): Promise<HlFill[]> {
  return info<HlFill[]>({ type: "userFills", user, aggregateByTime: true });
}

export async function fetchUserFillsByTime(
  user: string,
  startTime: number,
  endTime?: number,
): Promise<HlFill[]> {
  const body: Record<string, unknown> = { type: "userFillsByTime", user, startTime };
  if (endTime != null) body.endTime = endTime;
  return info<HlFill[]>(body);
}

/** Newest-first pages via userFills, then older via userFillsByTime. Cap ~10k. */
export async function fetchFillHistory(user: string, max = 4000): Promise<HlFill[]> {
  const first = await fetchUserFills(user);
  const seen = new Set<string>();
  const out: HlFill[] = [];
  const push = (rows: HlFill[]) => {
    for (const f of rows) {
      const k = `${f.tid}-${f.hash}-${f.time}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(f);
    }
  };
  push(first);
  let oldest = first.reduce((m, f) => Math.min(m, f.time), Date.now());
  while (out.length < max && first.length >= 50) {
    const older = await fetchUserFillsByTime(user, 0, oldest - 1);
    if (!older.length) break;
    const before = out.length;
    push(older);
    if (out.length === before) break;
    oldest = older.reduce((m, f) => Math.min(m, f.time), oldest);
    if (older.length < 100) break;
  }
  out.sort((a, b) => a.time - b.time);
  return out.slice(-max);
}

export async function fetchClearinghouse(user: string): Promise<HlClearinghouse> {
  return info<HlClearinghouse>({ type: "clearinghouseState", user });
}

export async function fetchPortfolio(user: string): Promise<[string, PortfolioBucket][]> {
  return info<[string, PortfolioBucket][]>({ type: "portfolio", user });
}
