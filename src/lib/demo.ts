import type { DayBundle, TapeEvent } from "./types";
import { toThreads } from "./reconstruct";
import { labelMistakes } from "./labels";

function t(h: number, m: number, s = 0) {
  return Date.UTC(2026, 8, 21, h, m, s);
}

const fills: TapeEvent[] = [
  { id: "1", time: t(9, 32), coin: "BTC", dir: "Open Long", side: "long", px: 112400, sz: 0.02, closedPnl: 0, fee: 1.1, startPosition: 0, hash: "demo1", oid: 1 },
  { id: "2", time: t(10, 18), coin: "BTC", dir: "Close Long", side: "long", px: 116600, sz: 0.02, closedPnl: 84, fee: 1.1, startPosition: 0.02, hash: "demo2", oid: 2 },
  { id: "3", time: t(11, 4), coin: "ETH", dir: "Open Long", side: "long", px: 4120, sz: 0.4, closedPnl: 0, fee: 0.8, startPosition: 0, hash: "demo3", oid: 3 },
  { id: "4", time: t(11, 41), coin: "ETH", dir: "Close Long", side: "long", px: 4042, sz: 0.4, closedPnl: -31, fee: 0.8, startPosition: 0.4, hash: "demo4", oid: 4 },
  { id: "5", time: t(11, 52), coin: "BTC", dir: "Open Short", side: "short", px: 116200, sz: 0.05, closedPnl: 0, fee: 2, startPosition: 0, hash: "demo5", oid: 5 },
  { id: "6", time: t(14, 21), coin: "BTC", dir: "Close Short", side: "short", px: 113360, sz: 0.05, closedPnl: 142, fee: 2, startPosition: -0.05, hash: "demo6", oid: 6 },
  { id: "7", time: t(18, 2), coin: "SOL", dir: "Open Long", side: "long", px: 238, sz: 12, closedPnl: 0, fee: 1.4, startPosition: 0, hash: "demo7", oid: 7 },
  { id: "8", time: t(18, 49), coin: "SOL", dir: "Close Long", side: "long", px: 230.7, sz: 12, closedPnl: -87, fee: 1.4, startPosition: 12, hash: "demo8", oid: 8 },
];

export function demoBundle(): DayBundle {
  const threads = toThreads(fills);
  const sol = threads.find((x) => x.coin === "SOL");
  if (sol) {
    sol.peakUnrealized = 196;
    sol.lateExitUsd = 196 - sol.closedPnl;
  }
  const mistakes = labelMistakes(fills, threads, 4200);
  mistakes.push({
    kind: "late_exit",
    label: "Late exit",
    definition: "Closed more than $40 under the best running closed PnL on the thread.",
    time: t(18, 49),
    coin: "SOL",
    detail: "At 14:21 you had $196 unrealized on the day. You held. SOL closed −$87.",
    threadId: sol?.id,
  });
  return {
    address: "demo",
    demo: true,
    asOf: t(18, 49),
    fills,
    threads,
    mistakes,
    equity: 4200,
    weekPnl: 108,
    dayPnl: fills.reduce((s, f) => s + f.closedPnl, 0),
    prevWeekPnl: 41,
    openLeverage: [],
  };
}
