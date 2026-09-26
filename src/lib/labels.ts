import type { Mistake, PositionThread, TapeEvent } from "./types";

const REVENGE_MS = 20 * 60 * 1000;
const LATE_EXIT_USD = 40;
const OVER_LEV = 12;

export function labelMistakes(
  events: TapeEvent[],
  threads: PositionThread[],
  equity: number | null,
): Mistake[] {
  const out: Mistake[] = [];
  const sorted = [...events].sort((a, b) => a.time - b.time);

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.closedPnl < 0 && cur.time - prev.time <= REVENGE_MS && /open/i.test(cur.dir)) {
      out.push({
        kind: "revenge",
        label: "Revenge trading",
        definition: "New size within 20 minutes of a losing fill.",
        time: cur.time,
        coin: cur.coin,
        detail: `${cur.coin} opened ${Math.round((cur.time - prev.time) / 60000)}m after a $${Math.abs(prev.closedPnl).toFixed(0)} loss`,
        fillId: cur.id,
      });
    }
  }

  for (const t of threads) {
    if (t.lateExitUsd >= LATE_EXIT_USD && t.closeTime) {
      out.push({
        kind: "late_exit",
        label: "Late exit",
        definition: "Closed more than $40 under the best running closed PnL on the thread.",
        time: t.closeTime,
        coin: t.coin,
        detail: `Peak $${t.peakUnrealized.toFixed(0)} vs close $${t.closedPnl.toFixed(0)} (gave back $${t.lateExitUsd.toFixed(0)})`,
        threadId: t.id,
      });
    }
    if (equity && equity > 0) {
      const notional = t.fills.reduce((s, f) => s + f.px * f.sz, 0);
      const lev = notional / equity;
      if (lev >= OVER_LEV) {
        out.push({
          kind: "over_leverage",
          label: "Over-leverage",
          definition: "Fill notional vs account equity ≥ 12×.",
          time: t.openTime,
          coin: t.coin,
          detail: `~${lev.toFixed(1)}× vs $${equity.toFixed(0)} equity`,
          threadId: t.id,
        });
      }
    }
  }

  const days = new Map<string, TapeEvent[]>();
  for (const e of sorted) {
    const key = new Date(e.time).toISOString().slice(0, 10);
    const arr = days.get(key) ?? [];
    arr.push(e);
    days.set(key, arr);
  }
  for (const [day, list] of days) {
    let peak = 0;
    let run = 0;
    let flipped = false;
    for (const e of list) {
      run += e.closedPnl;
      if (run > peak) peak = run;
      if (peak > 20 && run < 0) flipped = true;
    }
    if (flipped) {
      const last = list[list.length - 1];
      out.push({
        kind: "loss_after_win",
        label: "Loss after winning",
        definition: "Day went green by $20+, then closed red.",
        time: last.time,
        coin: last.coin,
        detail: `${day}: peak $${peak.toFixed(0)}, finished $${run.toFixed(0)}`,
      });
    }
  }

  return out.sort((a, b) => a.time - b.time);
}

export function countByKind(mistakes: Mistake[]) {
  const c = { revenge: 0, over_leverage: 0, late_exit: 0, loss_after_win: 0 };
  for (const m of mistakes) c[m.kind]++;
  return c;
}
