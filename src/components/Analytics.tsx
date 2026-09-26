import { usd } from "@/lib/format";
import { countByKind } from "@/lib/labels";
import type { DayBundle } from "@/lib/types";

const ROWS: { kind: keyof ReturnType<typeof countByKind>; title: string }[] = [
  { kind: "revenge", title: "Revenge trading" },
  { kind: "over_leverage", title: "Over-leverage" },
  { kind: "late_exit", title: "Late exits" },
  { kind: "loss_after_win", title: "Loss after winning" },
];

export function Analytics({ bundle }: { bundle: DayBundle }) {
  const c = countByKind(bundle.mistakes);
  const weekDelta =
    bundle.weekPnl != null && bundle.prevWeekPnl != null ? bundle.weekPnl - bundle.prevWeekPnl : null;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="panel" style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
        {ROWS.map((r) => (
          <div key={r.kind}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{r.title}</div>
            <div className="display" style={{ fontSize: 32 }}>{c[r.kind]}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>occurrences</div>
          </div>
        ))}
      </div>
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>This week vs last</div>
        <p style={{ margin: "8px 0 0" }}>
          Week PnL {usd(bundle.weekPnl)} · prior {usd(bundle.prevWeekPnl)}
          {weekDelta != null ? ` · diff ${usd(weekDelta)}` : ""}
        </p>
        {bundle.openLeverage.length > 0 && (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Open lev: {bundle.openLeverage.map((l) => `${l.coin} ${l.lev}× uPnL ${usd(l.uPnl)}`).join(" · ")}
          </p>
        )}
      </div>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {bundle.mistakes.map((m, i) => (
              <tr key={i}>
                <td>{m.label}</td>
                <td style={{ color: "var(--muted)" }}>{m.detail}</td>
              </tr>
            ))}
            {bundle.mistakes.length === 0 && (
              <tr>
                <td colSpan={2} style={{ color: "var(--muted)" }}>
                  No labeled mistakes on this tape. Rules are visible — not an LLM.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
