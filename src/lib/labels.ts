import type { CurvePoint, Fill, Mistake, Thread } from "./types";

export const RULES = {
  revenge: {
    label: "Revenge trading",
    rule: "Within 20 minutes of a material loss, size went straight back on at the same or larger notional.",
  },
  over_leverage: {
    label: "Over-leverage",
    rule: "Position notional reached 12× account equity or more.",
  },
  late_exit: {
    label: "Late exit",
    rule: "Closed at least $40 below the best mark-to-market the position reached.",
  },
  loss_after_win: {
    label: "Loss after winning",
    rule: "The day was $50 or more in profit, then finished red.",
  },
} as const;

const REVENGE_WINDOW_MS = 20 * 60 * 1000;
const REVENGE_MIN_USD = 25;
const REVENGE_EQUITY_FRAC = 0.002;
const LATE_EXIT_USD = 40;
const OVER_LEVERAGE_X = 12;
const GREEN_DAY_USD = 50;
const MAX_PER_KIND = 40;

/** A loss only counts as painful if it is big for this account. */
function materialLoss(equity: number | null) {
  if (!equity || equity <= 0) return REVENGE_MIN_USD;
  return Math.max(REVENGE_MIN_USD, equity * REVENGE_EQUITY_FRAC);
}

export function labelMistakes(params: {
  fills: Fill[];
  threads: Thread[];
  curve: CurvePoint[];
  equity: number | null;
}): { mistakes: Mistake[]; truncated: number } {
  const { fills, threads, curve, equity } = params;
  const buckets: Record<Mistake["kind"], Mistake[]> = {
    revenge: [],
    over_leverage: [],
    late_exit: [],
    loss_after_win: [],
  };

  const threshold = materialLoss(equity);
  const painful = fills
    .filter((f) => f.closedPnl <= -threshold)
    .sort((a, b) => a.time - b.time);

  const usedOpen = new Set<string>();
  for (const loss of painful) {
    const lossNotional = loss.px * loss.sz;
    const next = fills.find(
      (f) =>
        f.time > loss.time &&
        f.time - loss.time <= REVENGE_WINDOW_MS &&
        f.action === "open" &&
        !usedOpen.has(f.id) &&
        (f.coin === loss.coin || f.px * f.sz >= lossNotional),
    );
    if (!next) continue;
    usedOpen.add(next.id);
    const mins = Math.max(1, Math.round((next.time - loss.time) / 60_000));
    buckets.revenge.push({
      kind: "revenge",
      label: RULES.revenge.label,
      rule: RULES.revenge.rule,
      time: next.time,
      coin: next.coin,
      detail:
        next.coin === loss.coin
          ? `${next.coin} straight back on ${mins}m after a ${money(loss.closedPnl)} close`
          : `${next.coin} opened ${mins}m after a ${money(loss.closedPnl)} close on ${loss.coin}`,
      costUsd: null,
    });
  }

  for (const th of threads) {
    if (th.hasMark && th.closeTime && th.peakTime && th.gaveBack >= LATE_EXIT_USD) {
      const heldAfter = Math.max(0, Math.round((th.closeTime - th.peakTime) / 60_000));
      buckets.late_exit.push({
        kind: "late_exit",
        label: RULES.late_exit.label,
        rule: RULES.late_exit.rule,
        time: th.closeTime,
        coin: th.coin,
        detail: `Peaked ${money(th.peakUnrealized)}, held ${heldAfter}m longer, closed ${money(th.realized)}`,
        costUsd: th.gaveBack,
        threadId: th.id,
      });
    }
    if (equity && equity > 0 && th.maxNotional / equity >= OVER_LEVERAGE_X) {
      buckets.over_leverage.push({
        kind: "over_leverage",
        label: RULES.over_leverage.label,
        rule: RULES.over_leverage.rule,
        time: th.openTime,
        coin: th.coin,
        detail: `${(th.maxNotional / equity).toFixed(1)}× equity on ${th.coin} ($${Math.round(th.maxNotional).toLocaleString()} notional)`,
        costUsd: null,
        threadId: th.id,
      });
    }
  }

  if (curve.length) {
    let peak = 0;
    for (const p of curve) if (p.total > peak) peak = p.total;
    const final = curve[curve.length - 1];
    if (peak >= GREEN_DAY_USD && final.total < 0) {
      buckets.loss_after_win.push({
        kind: "loss_after_win",
        label: RULES.loss_after_win.label,
        rule: RULES.loss_after_win.rule,
        time: final.t,
        coin: "DAY",
        detail: `Day peaked ${money(peak)} and finished ${money(final.total)}`,
        costUsd: peak - final.total,
      });
    }
  }

  let truncated = 0;
  const mistakes: Mistake[] = [];
  for (const kind of Object.keys(buckets) as Mistake["kind"][]) {
    const list = buckets[kind].sort((a, b) => (b.costUsd ?? 0) - (a.costUsd ?? 0) || a.time - b.time);
    if (list.length > MAX_PER_KIND) truncated += list.length - MAX_PER_KIND;
    mistakes.push(...list.slice(0, MAX_PER_KIND));
  }
  return { mistakes: mistakes.sort((a, b) => a.time - b.time), truncated };
}

function money(n: number) {
  const sign = n > 0 ? "+" : "−";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`;
}

export function countByKind(mistakes: Mistake[]) {
  const c: Record<Mistake["kind"], number> = {
    revenge: 0,
    over_leverage: 0,
    late_exit: 0,
    loss_after_win: 0,
  };
  for (const m of mistakes) c[m.kind]++;
  return c;
}

export function totalLeak(mistakes: Mistake[]) {
  return mistakes.reduce((s, m) => s + (m.costUsd ?? 0), 0);
}
