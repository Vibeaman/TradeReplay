import { fetchClearinghouse, fetchFillHistory, fetchPortfolio, normalizeAddress } from "./hyperliquid";
import { labelMistakes } from "./labels";
import { toTape, toThreads } from "./reconstruct";
import type { DayBundle } from "./types";

function bucketPnl(hist: [number, string][] | undefined) {
  if (!hist?.length) return null;
  const last = Number(hist[hist.length - 1][1]);
  const first = Number(hist[0][1]);
  if (!Number.isFinite(last) || !Number.isFinite(first)) return last;
  return last;
}

export async function loadBundle(rawAddress: string): Promise<DayBundle> {
  const address = normalizeAddress(rawAddress);
  const [fillsRaw, ch, port] = await Promise.all([
    fetchFillHistory(address),
    fetchClearinghouse(address).catch(() => null),
    fetchPortfolio(address).catch(() => null),
  ]);
  const fills = toTape(fillsRaw);
  const threads = toThreads(fills);
  const equity = ch?.marginSummary?.accountValue != null ? Number(ch.marginSummary.accountValue) : null;
  const mistakes = labelMistakes(fills, threads, equity);
  const map = new Map((port ?? []).map(([k, v]) => [k, v]));
  const day = map.get("day") ?? map.get("perpDay");
  const week = map.get("week") ?? map.get("perpWeek");
  const month = map.get("month");
  const openLeverage =
    ch?.assetPositions?.map((p) => ({
      coin: p.position.coin,
      lev: Number(p.position.leverage?.value ?? 0),
      uPnl: Number(p.position.unrealizedPnl ?? 0),
    })) ?? [];
  return {
    address,
    demo: false,
    asOf: Date.now(),
    fills,
    threads,
    mistakes,
    equity,
    weekPnl: bucketPnl(week?.pnlHistory),
    dayPnl: fills.reduce((s, f) => s + f.closedPnl, 0),
    prevWeekPnl: bucketPnl(month?.pnlHistory),
    openLeverage,
  };
}
