"use client";

import { useMemo } from "react";
import type { CurvePoint, Fill } from "@/lib/types";
import { clock, usd } from "@/lib/format";

const W = 760;
const H = 190;
const PAD_T = 14;
const PAD_B = 22;

export function EquityCurve({
  curve,
  fills,
  cursorT,
  peakTime,
  onScrubTo,
}: {
  curve: CurvePoint[];
  fills: Fill[];
  cursorT: number;
  peakTime?: number | null;
  onScrubTo?: (t: number) => void;
}) {
  const geo = useMemo(() => {
    if (curve.length < 2) return null;
    const t0 = curve[0].t;
    const t1 = curve[curve.length - 1].t;
    const vals = curve.map((p) => p.total);
    let lo = Math.min(0, ...vals);
    let hi = Math.max(0, ...vals);
    if (hi - lo < 1) {
      hi += 1;
      lo -= 1;
    }
    const padV = (hi - lo) * 0.12;
    lo -= padV;
    hi += padV;
    const x = (t: number) => ((t - t0) / (t1 - t0)) * W;
    const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * (H - PAD_T - PAD_B);
    const line = curve.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.total).toFixed(1)}`).join("");
    const area = `${line}L${W},${y(lo)}L0,${y(lo)}Z`;
    return { x, y, line, area, t0, t1, zeroY: y(0) };
  }, [curve]);

  if (!geo) {
    return (
      <div className="panel panel-pad dim" style={{ fontSize: 13 }}>
        Not enough points to draw the day.
      </div>
    );
  }

  const g = geo;
  const cursorX = g.x(Math.min(Math.max(cursorT, g.t0), g.t1));
  const at = curve.reduce((best, p) => (Math.abs(p.t - cursorT) < Math.abs(best.t - cursorT) ? p : best), curve[0]);
  const positive = at.total >= 0;

  function pick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onScrubTo) return;
    const box = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    onScrubTo(g.t0 + frac * (g.t1 - g.t0));
  }

  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div className="panel-pad between" style={{ paddingBottom: 6 }}>
        <div>
          <div className="label">Day P&amp;L · realized + open</div>
          <div className="mono stat-v" style={{ color: positive ? "var(--up)" : "var(--down)" }}>
            {usd(at.total)}
          </div>
        </div>
        <div className="row" style={{ gap: 14, fontSize: 12 }}>
          <span className="dim">
            realized <span className="mono">{usd(at.realized)}</span>
          </span>
          <span className="dim">
            open <span className="mono">{usd(at.unrealized)}</span>
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: H, display: "block", cursor: onScrubTo ? "crosshair" : "default" }}
        onClick={pick}
      >
        <defs>
          <linearGradient id="tr-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#97fce4" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#97fce4" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1="0" y1={g.zeroY} x2={W} y2={g.zeroY} stroke="#17262b" strokeWidth="1" strokeDasharray="3 4" />
        <path d={g.area} fill="url(#tr-fill)" />
        <path d={g.line} fill="none" stroke="#97fce4" strokeWidth="1.8" strokeLinejoin="round" />

        {peakTime != null && (() => {
          const pxAt = g.x(peakTime);
          const flip = pxAt > W - 44;
          return (
            <g>
              <line
                x1={pxAt}
                y1={PAD_T}
                x2={pxAt}
                y2={H - PAD_B}
                stroke="#50d2c1"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.7"
              />
              <text
                x={flip ? pxAt - 5 : pxAt + 5}
                y={PAD_T + 9}
                fill="#50d2c1"
                fontSize="9"
                textAnchor={flip ? "end" : "start"}
                fontFamily="JetBrains Mono, monospace"
              >
                PEAK
              </text>
            </g>
          );
        })()}

        {fills.map((f) => (
          <circle
            key={f.id}
            cx={g.x(f.time)}
            cy={g.zeroY}
            r="2.6"
            fill={f.closedPnl > 0 ? "#1fd196" : f.closedPnl < 0 ? "#ed6a5e" : "#7d9997"}
          />
        ))}

        <line x1={cursorX} y1={PAD_T} x2={cursorX} y2={H - PAD_B} stroke="#e9f6f3" strokeWidth="1" opacity="0.55" />
        <circle cx={cursorX} cy={g.y(at.total)} r="4" fill="#04060c" stroke="#97fce4" strokeWidth="2" />

        <text x="2" y={H - 6} fill="#536b6b" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
          {clock(g.t0)}
        </text>
        <text x={W - 2} y={H - 6} fill="#536b6b" fontSize="9.5" textAnchor="end" fontFamily="JetBrains Mono, monospace">
          {clock(g.t1)}
        </text>
      </svg>
    </div>
  );
}
