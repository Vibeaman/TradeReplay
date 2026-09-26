"use client";

import { clock, cn, px as fmtPx, tone, usd } from "@/lib/format";
import type { Fill } from "@/lib/types";

export function Tape({
  fills,
  activeId,
  onPick,
}: {
  fills: Fill[];
  activeId?: string | null;
  onPick?: (f: Fill) => void;
}) {
  return (
    <div className="panel">
      <div className="panel-pad between" style={{ paddingBottom: 12 }}>
        <h2>The tape</h2>
        <span className="label">{fills.length} fills</span>
      </div>
      <hr className="sep" />
      <div className="table-wrap scroll-y">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Asset</th>
              <th>Action</th>
              <th className="num">Price</th>
              <th className="num">Size</th>
              <th className="num">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {fills.map((f) => (
              <tr
                key={f.id}
                data-click={onPick ? "true" : "false"}
                data-on={activeId === f.id ? "true" : "false"}
                onClick={() => onPick?.(f)}
              >
                <td className="mono dim">{clock(f.time)}</td>
                <td style={{ fontWeight: 560 }}>{f.coin}</td>
                <td>
                  <span className={cn("pill", f.bias === "long" ? "long" : "short")}>
                    {f.dir}
                  </span>
                </td>
                <td className="mono num dim">{fmtPx(f.px)}</td>
                <td className="mono num dim">{f.sz}</td>
                <td className={cn("mono num", tone(f.closedPnl))}>
                  {f.closedPnl === 0 ? "—" : usd(f.closedPnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
