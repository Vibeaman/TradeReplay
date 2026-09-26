import type { HlCandle, HlClearinghouse, HlFill, PortfolioBucket } from "./types";

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
    throw new Error(`Hyperliquid ${res.status}: ${text.slice(0, 160)}`);
  }
  return (await res.json()) as T;
}

export function normalizeAddress(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) throw new Error("Paste your Hyperliquid account address.");
  const hex = s.startsWith("0x") ? s : `0x${s}`;
  if (!/^0x[a-fA-F0-9]{40}$/.test(hex)) {
    throw new Error("That is not a valid address. Use the account address, 0x plus 40 hex characters.");
  }
  return hex.toLowerCase();
}

export function fetchUserFills(user: string) {
  return info<HlFill[]>({ type: "userFills", user, aggregateByTime: true });
}

export function fetchUserFillsByTime(user: string, startTime: number, endTime?: number) {
  const body: Record<string, unknown> = { type: "userFillsByTime", user, startTime, aggregateByTime: true };
  if (endTime != null) body.endTime = endTime;
  return info<HlFill[]>(body);
}

/** Walk backwards from newest. Hyperliquid keeps ~10k fills. */
export async function fetchFillHistory(user: string, maxPages = 6): Promise<HlFill[]> {
  const seen = new Set<string>();
  const out: HlFill[] = [];
  const push = (rows: HlFill[]) => {
    let added = 0;
    for (const f of rows) {
      const key = `${f.tid}:${f.time}:${f.oid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
      added++;
    }
    return added;
  };

  const first = await fetchUserFills(user);
  push(first);
  let oldest = out.reduce((m, f) => Math.min(m, f.time), Date.now());

  for (let page = 1; page < maxPages; page++) {
    if (out.length === 0) break;
    const older = await fetchUserFillsByTime(user, 0, oldest - 1).catch(() => [] as HlFill[]);
    if (!older.length) break;
    const added = push(older);
    const nextOldest = older.reduce((m, f) => Math.min(m, f.time), oldest);
    if (added === 0 || nextOldest >= oldest) break;
    oldest = nextOldest;
  }

  out.sort((a, b) => a.time - b.time);
  return out;
}

export function fetchClearinghouse(user: string) {
  return info<HlClearinghouse>({ type: "clearinghouseState", user });
}

export function fetchPortfolio(user: string) {
  return info<[string, PortfolioBucket][]>({ type: "portfolio", user });
}

export function fetchCandles(coin: string, interval: string, startTime: number, endTime: number) {
  return info<HlCandle[]>({ type: "candleSnapshot", req: { coin, interval, startTime, endTime } });
}

/** Mark price path per coin, keyed by candle open time. */
export async function fetchMarkPaths(
  coins: string[],
  startTime: number,
  endTime: number,
  interval = "1m",
): Promise<Record<string, Array<[number, number]>>> {
  const paths: Record<string, Array<[number, number]>> = {};
  const results = await Promise.all(
    coins.map(async (coin) => {
      try {
        const rows = await fetchCandles(coin, interval, startTime, endTime);
        return [coin, rows.map((r) => [r.t, Number(r.c)] as [number, number])] as const;
      } catch {
        return [coin, [] as Array<[number, number]>] as const;
      }
    }),
  );
  for (const [coin, path] of results) {
    if (path.length) paths[coin] = path;
  }
  return paths;
}
