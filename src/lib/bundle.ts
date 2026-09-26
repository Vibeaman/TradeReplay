import {
  fetchClearinghouse,
  fetchFillHistory,
  fetchMarkPaths,
  fetchPortfolio,
  normalizeAddress,
} from "./hyperliquid";
import { labelMistakes } from "./labels";
import { buildCurve, dayKey, dayRange, toFills } from "./reconstruct";
import type { DayBundle, DaySummary, Fill, ImportSummary, PortfolioBucket } from "./types";

const MAX_COINS_PER_DAY = 14;

function lastValue(hist: [number, string][] | undefined) {
  if (!hist?.length) return null;
  const v = Number(hist[hist.length - 1][1]);
  return Number.isFinite(v) ? v : null;
}

function summarize(fills: Fill[]): DaySummary[] {
  const byDay = new Map<string, Fill[]>();
  for (const f of fills) {
    const k = dayKey(f.time);
    const arr = byDay.get(k) ?? [];
    arr.push(f);
    byDay.set(k, arr);
  }
  const out: DaySummary[] = [];
  for (const [date, list] of byDay) {
    const { start, end } = dayRange(date);
    const coins = [...new Set(list.map((f) => f.coin))];
    out.push({
      date,
      start,
      end,
      realized: list.reduce((s, f) => s + f.closedPnl, 0),
      fills: list.length,
      coins,
    });
  }
  return out.sort((a, b) => b.start - a.start);
}

export async function loadImport(rawAddress: string): Promise<ImportSummary> {
  const address = normalizeAddress(rawAddress);
  const [raw, ch, port] = await Promise.all([
    fetchFillHistory(address),
    fetchClearinghouse(address).catch(() => null),
    fetchPortfolio(address).catch(() => null),
  ]);
  if (!raw.length) {
    throw new Error(
      "No fills for that address. Use the account address you trade from, not an agent or API wallet.",
    );
  }
  const fills = toFills(raw);
  const buckets = new Map<string, PortfolioBucket>(port ?? []);
  const equity = ch?.marginSummary?.accountValue != null ? Number(ch.marginSummary.accountValue) : null;

  return {
    address,
    equity,
    totalFills: fills.length,
    days: summarize(fills),
    weekRealized: lastValue(buckets.get("week")?.pnlHistory),
    prevWeekRealized: lastValue(buckets.get("month")?.pnlHistory),
    openPositions:
      ch?.assetPositions?.map((p) => ({
        coin: p.position.coin,
        szi: Number(p.position.szi ?? 0),
        lev: Number(p.position.leverage?.value ?? 0),
        uPnl: Number(p.position.unrealizedPnl ?? 0),
      })) ?? [],
  };
}

export async function loadDay(rawAddress: string, date: string): Promise<DayBundle> {
  const address = normalizeAddress(rawAddress);
  const { start, end } = dayRange(date);
  if (!Number.isFinite(start)) throw new Error("Bad date.");

  const [raw, ch, port] = await Promise.all([
    fetchFillHistory(address),
    fetchClearinghouse(address).catch(() => null),
    fetchPortfolio(address).catch(() => null),
  ]);

  const all = toFills(raw);
  const fills = all.filter((f) => f.time >= start && f.time < end);
  if (!fills.length) throw new Error(`No fills on ${date}.`);

  const byCount = new Map<string, number>();
  const byNotional = new Map<string, number>();
  for (const f of fills) {
    byCount.set(f.coin, (byCount.get(f.coin) ?? 0) + 1);
    byNotional.set(f.coin, (byNotional.get(f.coin) ?? 0) + f.px * f.sz);
  }
  // marks cost one request per asset, so cover the coins that actually moved money
  const coins = [...byNotional.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_COINS_PER_DAY)
    .map(([c]) => c);

  const lastTrade = fills[fills.length - 1].time;
  const marks = await fetchMarkPaths(coins, start, Math.min(end, lastTrade + 30 * 60_000)).catch(
    () => ({}) as Record<string, Array<[number, number]>>,
  );

  const { curve, threads } = buildCurve(fills, marks, start, end);
  const equity = ch?.marginSummary?.accountValue != null ? Number(ch.marginSummary.accountValue) : null;
  const { mistakes, truncated } = labelMistakes({ fills, threads, curve, equity });
  const buckets = new Map<string, PortfolioBucket>(port ?? []);

  let peakTotal = curve.length ? curve[0].total : 0;
  let peakTime: number | null = curve.length ? curve[0].t : null;
  for (const p of curve) {
    if (p.total > peakTotal) {
      peakTotal = p.total;
      peakTime = p.t;
    }
  }

  return {
    address,
    demo: false,
    date,
    dayStart: start,
    dayEnd: end,
    fills,
    threads,
    curve,
    mistakes,
    realized: fills.reduce((s, f) => s + f.closedPnl, 0),
    fees: fills.reduce((s, f) => s + f.fee, 0),
    peakTotal,
    peakTime,
    equity,
    weekRealized: lastValue(buckets.get("week")?.pnlHistory),
    prevWeekRealized: lastValue(buckets.get("month")?.pnlHistory),
    tradedCoins: [...byCount.keys()],
    hasMarks: Object.keys(marks).length > 0,
    markedCoins: Object.keys(marks),
    truncatedMistakes: truncated,
  };
}
