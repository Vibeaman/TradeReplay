import { labelMistakes } from "./labels";
import { buildCurve } from "./reconstruct";
import type { DayBundle, Fill, ImportSummary } from "./types";

const DATE = "2026-09-21";
const DAY_START = Date.parse(`${DATE}T00:00:00.000Z`);

function at(h: number, m: number) {
  return Date.parse(`${DATE}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`);
}

const RAW: Array<Omit<Fill, "id">> = [
  { time: at(9, 32), coin: "BTC", dir: "Open Long", action: "open", bias: "long", px: 112400, sz: 0.06, signedSz: 0.06, closedPnl: 0, fee: 2.02, hash: "0xdemo01", oid: 1001 },
  { time: at(10, 18), coin: "BTC", dir: "Close Long", action: "close", bias: "long", px: 113800, sz: 0.06, signedSz: -0.06, closedPnl: 84, fee: 2.05, hash: "0xdemo02", oid: 1002 },
  { time: at(11, 4), coin: "ETH", dir: "Open Long", action: "open", bias: "long", px: 4120, sz: 1.2, signedSz: 1.2, closedPnl: 0, fee: 1.78, hash: "0xdemo03", oid: 1003 },
  { time: at(11, 41), coin: "ETH", dir: "Close Long", action: "close", bias: "long", px: 4094, sz: 1.2, signedSz: -1.2, closedPnl: -31, fee: 1.77, hash: "0xdemo04", oid: 1004 },
  { time: at(11, 52), coin: "BTC", dir: "Open Short", action: "open", bias: "short", px: 114050, sz: 0.09, signedSz: -0.09, closedPnl: 0, fee: 3.08, hash: "0xdemo05", oid: 1005 },
  { time: at(14, 21), coin: "BTC", dir: "Close Short", action: "close", bias: "short", px: 112470, sz: 0.09, signedSz: 0.09, closedPnl: 142, fee: 3.04, hash: "0xdemo06", oid: 1006 },
  { time: at(18, 2), coin: "SOL", dir: "Open Long", action: "open", bias: "long", px: 238, sz: 46, signedSz: 46, closedPnl: 0, fee: 1.64, hash: "0xdemo07", oid: 1007 },
  { time: at(18, 49), coin: "SOL", dir: "Close Long", action: "close", bias: "long", px: 236.11, sz: 46, signedSz: -46, closedPnl: -87, fee: 1.63, hash: "0xdemo08", oid: 1008 },
];

const FILLS: Fill[] = RAW.map((f, i) => ({ ...f, id: `demo-${i + 1}` }));

/** Deterministic mark paths so the demo replay is identical every run. */
function synthPath(
  coin: string,
  from: number,
  to: number,
  anchor: number,
  shape: (frac: number) => number,
): [string, Array<[number, number]>] {
  const path: Array<[number, number]> = [];
  const steps = Math.max(1, Math.round((to - from) / 60_000));
  for (let i = 0; i <= steps; i++) {
    const t = from + i * 60_000;
    path.push([t, anchor * (1 + shape(i / steps))]);
  }
  return [coin, path];
}

function demoMarks(): Record<string, Array<[number, number]>> {
  const btc = synthPath("BTC", at(9, 0), at(15, 0), 112400, (f) => {
    if (f < 0.21) return 0.0125 * (f / 0.21);
    if (f < 0.48) return 0.0147 - 0.004 * ((f - 0.21) / 0.27);
    if (f < 0.72) return -0.0095 * ((f - 0.48) / 0.24) + 0.0107;
    return 0.0006;
  });
  const eth = synthPath("ETH", at(11, 0), at(12, 0), 4120, (f) => 0.004 * Math.sin(f * Math.PI) - 0.0063 * f);
  const sol = synthPath("SOL", at(18, 0), at(19, 0), 238, (f) => {
    // opens 18:02, peaks about +$196 on 46 SOL at 18:25, bleeds to -$87 by 18:49
    const open = 2 / 60;
    const peak = 25 / 60;
    const close = 49 / 60;
    const peakPct = 0.0179;
    const closePct = -0.00794;
    if (f <= open) return 0;
    if (f <= peak) return peakPct * ((f - open) / (peak - open));
    if (f <= close) return peakPct + (closePct - peakPct) * ((f - peak) / (close - peak));
    return closePct;
  });
  return Object.fromEntries([btc, eth, sol]);
}

export function demoDay(): DayBundle {
  const marks = demoMarks();
  const { curve, threads } = buildCurve(FILLS, marks, DAY_START, DAY_START + 86_400_000);
  const equity = 9400;
  const { mistakes, truncated } = labelMistakes({ fills: FILLS, threads, curve, equity });

  let peakTotal = curve.length ? curve[0].total : 0;
  let peakTime: number | null = curve.length ? curve[0].t : null;
  for (const p of curve) {
    if (p.total > peakTotal) {
      peakTotal = p.total;
      peakTime = p.t;
    }
  }

  return {
    address: "demo",
    demo: true,
    date: DATE,
    dayStart: DAY_START,
    dayEnd: DAY_START + 86_400_000,
    fills: FILLS,
    threads,
    curve,
    mistakes,
    realized: FILLS.reduce((s, f) => s + f.closedPnl, 0),
    fees: FILLS.reduce((s, f) => s + f.fee, 0),
    peakTotal,
    peakTime,
    equity,
    weekRealized: 108,
    prevWeekRealized: 402,
    tradedCoins: ["BTC", "ETH", "SOL"],
    hasMarks: true,
    markedCoins: ["BTC", "ETH", "SOL"],
    truncatedMistakes: truncated,
  };
}

export function demoImport(): ImportSummary {
  const day = demoDay();
  return {
    address: "demo",
    equity: day.equity,
    totalFills: day.fills.length,
    days: [
      {
        date: day.date,
        start: day.dayStart,
        end: day.dayEnd,
        realized: day.realized,
        fills: day.fills.length,
        coins: day.tradedCoins,
      },
    ],
    weekRealized: day.weekRealized,
    prevWeekRealized: day.prevWeekRealized,
    openPositions: [],
  };
}
