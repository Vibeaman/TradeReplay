import type { HlFill, PositionThread, TapeEvent } from "./types";

export function toTape(fills: HlFill[]): TapeEvent[] {
  return fills
    .map((f) => {
      const dir = (f.dir || "").toLowerCase();
      let side: TapeEvent["side"] = "flat";
      if (dir.includes("long")) side = "long";
      else if (dir.includes("short")) side = "short";
      else if (f.side === "B") side = "long";
      else if (f.side === "A") side = "short";
      return {
        id: `${f.tid}-${f.oid}-${f.time}`,
        time: f.time,
        coin: f.coin,
        dir: f.dir || (f.side === "B" ? "Buy" : "Sell"),
        side,
        px: Number(f.px),
        sz: Number(f.sz),
        closedPnl: Number(f.closedPnl || 0),
        fee: Number(f.fee || 0),
        startPosition: Number(f.startPosition || 0),
        hash: f.hash,
        oid: f.oid,
      };
    })
    .sort((a, b) => a.time - b.time);
}

function isOpen(e: TapeEvent) {
  return /open/i.test(e.dir);
}
function isClose(e: TapeEvent) {
  return /close/i.test(e.dir);
}

export function toThreads(events: TapeEvent[]): PositionThread[] {
  const open: Record<string, PositionThread> = {};
  const done: PositionThread[] = [];

  for (const e of events) {
    const key = `${e.coin}:${e.side === "flat" ? "long" : e.side}`;
    let t = open[key];
    if (!t || isOpen(e)) {
      if (t && isOpen(e) && t.fills.length) {
        t.closeTime = t.fills[t.fills.length - 1].time;
        t.holdMs = t.closeTime - t.openTime;
        done.push(t);
      }
      t = {
        id: `${e.coin}-${e.time}`,
        coin: e.coin,
        side: e.side === "flat" ? "long" : e.side,
        openTime: e.time,
        closeTime: null,
        fills: [],
        closedPnl: 0,
        peakUnrealized: 0,
        holdMs: 0,
        lateExitUsd: 0,
      };
      open[key] = t;
    }
    t.fills.push(e);
    t.closedPnl += e.closedPnl;
    const running = t.fills.reduce((s, x) => s + x.closedPnl, 0);
    if (running > t.peakUnrealized) t.peakUnrealized = running;
    if (isClose(e) || Math.abs(e.startPosition) < 1e-8) {
      t.closeTime = e.time;
      t.holdMs = t.closeTime - t.openTime;
      t.lateExitUsd = Math.max(0, t.peakUnrealized - t.closedPnl);
      done.push(t);
      delete open[key];
    }
  }
  for (const t of Object.values(open)) {
    t.holdMs = (t.fills.at(-1)?.time ?? t.openTime) - t.openTime;
    t.lateExitUsd = Math.max(0, t.peakUnrealized - t.closedPnl);
    done.push(t);
  }
  return done.sort((a, b) => a.openTime - b.openTime);
}

export function eventsOnDay(events: TapeEvent[], dayStart: number, dayEnd: number) {
  return events.filter((e) => e.time >= dayStart && e.time < dayEnd);
}

export function dayBounds(ms: number, tzOffsetMin = 0) {
  const d = new Date(ms + tzOffsetMin * 60_000);
  d.setUTCHours(0, 0, 0, 0);
  const start = d.getTime() - tzOffsetMin * 60_000;
  return { start, end: start + 86_400_000 };
}
