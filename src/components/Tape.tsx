"use client";

import { clock, cn, usd } from "@/lib/format";
import type { TapeEvent } from "@/lib/types";

export function Tape({
  fills,
  activeId,
  onPick,
}: {
  fills: TapeEvent[];
  activeId?: string;
  onPick?: (id: string) => void;
}) {
  return (
    <div className="panel" style={{ overflow: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Asset</th>
            <th>Dir</th>
            <th style={{ textAlign: "right" }}>PnL</th>
          </tr>
        </thead>
        <tbody>
          {fills.map((f) => (
            <tr
              key={f.id}
              onClick={() => onPick?.(f.id)}
              style={{
                cursor: onPick ? "pointer" : "default",
                background: activeId === f.id ? "rgba(232,197,71,0.12)" : undefined,
              }}
            >
              <td className="mono">{clock(f.time)}</td>
              <td>{f.coin}</td>
              <td style={{ color: "var(--muted)" }}>{f.dir}</td>
              <td className={cn("mono", f.closedPnl > 0 ? "up" : f.closedPnl < 0 ? "down" : "")} style={{ textAlign: "right" }}>
                {f.closedPnl === 0 ? "—" : usd(f.closedPnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
