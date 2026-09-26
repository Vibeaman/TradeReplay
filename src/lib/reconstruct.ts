import type { CurvePoint, Fill, HlFill, Thread } from "./types";

/** Hyperliquid gives side B = buy, A = sell, plus startPosition before the fill. */
export function toFills(raw: HlFill[]): Fill[] {
  return raw
    .map((f) => {
      const sz = Number(f.sz);
      const sign = f.side === "B" ? 1 : -1;
      const dir = f.dir || (f.side === "B" ? "Buy" : "Sell");
      const lower = dir.toLowerCase();
      const action: Fill["action"] = lower.includes("open")
        ? "open"
        : lower.includes("close") || lower.includes("settle") || lower.includes("liquidat")
          ? "close"
          : "other";
      const bias: Fill["bias"] = lower.includes("long")
        ? "long"
        : lower.includes("short")
          ? "short"
          : sign > 0
            ? "long"
            : "short";
      return {
        id: `${f.tid}-${f.oid}-${f.time}`,
        time: f.time,
        coin: f.coin,
        dir,
        action,
        bias,
        px: Number(f.px),
        sz,
        signedSz: sign * sz,
        closedPnl: Number(f.closedPnl || 0),
        fee: Number(f.fee || 0),
        hash: f.hash,
        oid: f.oid,
      };
    })
    .filter((f) => Number.isFinite(f.px) && Number.isFinite(f.sz))
    .sort((a, b) => a.time - b.time);
}

type Leg = { pos: number; avgEntry: number };

/** Replay fills for one coin, tracking signed position and average entry. */
function walkCoin(fills: Fill[]) {
  const states: Array<{ fill: Fill; before: Leg; after: Leg }> = [];
  let pos = 0;
  let avgEntry = 0;

  for (const f of fills) {
    const before: Leg = { pos, avgEntry };
    const next = pos + f.signedSz;

    if (pos === 0 || Math.sign(next) === Math.sign(pos)) {
      if (Math.abs(next) > Math.abs(pos)) {
        const added = Math.abs(next) - Math.abs(pos);
        avgEntry = (avgEntry * Math.abs(pos) + f.px * added) / Math.abs(next);
      }
    } else {
      // crossed through flat, remainder opens the other way at this price
      avgEntry = next === 0 ? 0 : f.px;
    }
    if (next === 0) avgEntry = 0;
    pos = next;
    states.push({ fill: f, before, after: { pos, avgEntry } });
  }
  return states;
}

/** Group each coin's fills into flat-to-flat threads. */
export function toThreads(fills: Fill[]): Thread[] {
  const byCoin = new Map<string, Fill[]>();
  for (const f of fills) {
    const arr = byCoin.get(f.coin) ?? [];
    arr.push(f);
    byCoin.set(f.coin, arr);
  }

  const threads: Thread[] = [];
  for (const [coin, list] of byCoin) {
    const states = walkCoin(list);
    let current: Thread | null = null;

    for (const s of states) {
      if (!current) {
        current = {
          id: `${coin}-${s.fill.time}`,
          coin,
          bias: s.after.pos >= 0 ? "long" : "short",
          openTime: s.fill.time,
          closeTime: null,
          fills: [],
          realized: 0,
          fees: 0,
          peakUnrealized: 0,
          peakTime: null,
          troughUnrealized: 0,
          holdMs: 0,
          gaveBack: 0,
          maxNotional: 0,
          hasMark: false,
        };
      }
      current.fills.push(s.fill);
      current.realized += s.fill.closedPnl;
      current.fees += s.fill.fee;
      current.maxNotional = Math.max(current.maxNotional, Math.abs(s.after.pos) * s.fill.px);

      if (s.after.pos === 0) {
        current.closeTime = s.fill.time;
        current.holdMs = s.fill.time - current.openTime;
        threads.push(current);
        current = null;
      }
    }
    if (current) {
      const last = current.fills[current.fills.length - 1];
      current.holdMs = (last?.time ?? current.openTime) - current.openTime;
      threads.push(current);
    }
  }
  return threads.sort((a, b) => a.openTime - b.openTime);
}

function markAt(path: Array<[number, number]> | undefined, t: number): number | null {
  if (!path?.length) return null;
  let lo = 0;
  let hi = path.length - 1;
  if (t < path[0][0]) return path[0][1];
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (path[mid][0] <= t) lo = mid;
    else hi = mid - 1;
  }
  return path[lo][1];
}

/**
 * Minute-by-minute realized + unrealized for the day, using Hyperliquid candle closes.
 * Unrealized = signed position * (mark - average entry).
 */
export function buildCurve(
  fills: Fill[],
  marks: Record<string, Array<[number, number]>>,
  dayStart: number,
  dayEnd: number,
  stepMs = 60_000,
): { curve: CurvePoint[]; threads: Thread[] } {
  const threads = toThreads(fills);
  const byCoin = new Map<string, Array<{ fill: Fill; pos: number; avgEntry: number }>>();
  for (const f of fills) {
    const arr = byCoin.get(f.coin) ?? [];
    arr.push({ fill: f, pos: 0, avgEntry: 0 });
    byCoin.set(f.coin, arr);
  }
  for (const [coin, list] of byCoin) {
    const states = walkCoin(list.map((x) => x.fill));
    byCoin.set(
      coin,
      states.map((s) => ({ fill: s.fill, pos: s.after.pos, avgEntry: s.after.avgEntry })),
    );
  }

  const lastTrade = fills.length ? fills[fills.length - 1].time : dayStart;
  const firstTrade = fills.length ? fills[0].time : dayStart;
  // start just before the first fill so the chart is the session, not 9 hours of flat
  const from = Math.max(dayStart, firstTrade - 10 * stepMs);
  const end = Math.min(dayEnd, Math.max(lastTrade + 5 * stepMs, from + stepMs));
  const curve: CurvePoint[] = [];

  for (let t = from; t <= end; t += stepMs) {
    let realized = 0;
    let unrealized = 0;
    for (const [coin, states] of byCoin) {
      let pos = 0;
      let avgEntry = 0;
      for (const s of states) {
        if (s.fill.time > t) break;
        realized += s.fill.closedPnl;
        pos = s.pos;
        avgEntry = s.avgEntry;
      }
      if (pos !== 0 && avgEntry > 0) {
        const mark = markAt(marks[coin], t);
        if (mark != null) unrealized += pos * (mark - avgEntry);
      }
    }
    curve.push({ t, realized, unrealized, total: realized + unrealized });
  }

  // attach real peak unrealized per thread from the mark path
  for (const th of threads) {
    const path = marks[th.coin];
    if (!path?.length) continue;
    const states = walkCoin(th.fills);
    let peak = 0;
    let peakTime: number | null = null;
    let trough = 0;
    const closeT = th.closeTime ?? th.fills[th.fills.length - 1]?.time ?? th.openTime;
    for (let t = th.openTime; t <= closeT; t += stepMs) {
      let pos = 0;
      let avgEntry = 0;
      let realized = 0;
      for (const s of states) {
        if (s.fill.time > t) break;
        pos = s.after.pos;
        avgEntry = s.after.avgEntry;
        realized += s.fill.closedPnl;
      }
      const mark = markAt(path, t);
      if (mark == null) continue;
      const open = pos !== 0 && avgEntry > 0 ? pos * (mark - avgEntry) : 0;
      const pnl = realized + open;
      if (pnl > peak) {
        peak = pnl;
        peakTime = t;
      }
      if (pnl < trough) trough = pnl;
    }
    th.peakUnrealized = peak;
    th.peakTime = peakTime;
    th.troughUnrealized = trough;
    th.hasMark = true;
    th.gaveBack = Math.max(0, peak - th.realized);
  }

  return { curve, threads };
}

export function dayKey(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function dayRange(date: string) {
  const start = Date.parse(`${date}T00:00:00.000Z`);
  return { start, end: start + 86_400_000 };
}
