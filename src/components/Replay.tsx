"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EquityCurve } from "./EquityCurve";
import { Tape } from "./Tape";
import { clock, cn, hold, usd } from "@/lib/format";
import type { DayBundle, Fill } from "@/lib/types";

export function Replay({ bundle }: { bundle: DayBundle }) {
  const { curve, fills, threads } = bundle;
  const [idx, setIdx] = useState(curve.length ? curve.length - 1 : 0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setIdx(curve.length ? curve.length - 1 : 0);
  }, [curve.length]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setIdx((i) => {
        if (i >= curve.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 45);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, curve.length]);

  const point = curve[Math.min(idx, curve.length - 1)];
  const cursorT = point?.t ?? bundle.dayStart;

  const openThread = useMemo(
    () =>
      threads.find(
        (t) => t.openTime <= cursorT && (t.closeTime == null || t.closeTime >= cursorT),
      ) ?? null,
    [threads, cursorT],
  );

  const nextFill = useMemo(() => fills.find((f) => f.time > cursorT) ?? null, [fills, cursorT]);
  const lastFill = useMemo(
    () => [...fills].reverse().find((f) => f.time <= cursorT) ?? null,
    [fills, cursorT],
  );

  const peakSoFar = useMemo(() => {
    let p = 0;
    for (let i = 0; i <= Math.min(idx, curve.length - 1); i++) {
      if (curve[i].total > p) p = curve[i].total;
    }
    return p;
  }, [curve, idx]);

  function jumpTo(t: number) {
    let best = 0;
    let bestD = Infinity;
    curve.forEach((p, i) => {
      const d = Math.abs(p.t - t);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setIdx(best);
    setPlaying(false);
  }

  if (!curve.length || !point) {
    return <div className="panel panel-pad dim">No curve for this day.</div>;
  }

  const pct = (idx / Math.max(1, curve.length - 1)) * 100;
  const givingBack = peakSoFar - point.total;

  return (
    <div className="grid">
      <EquityCurve
        curve={curve}
        fills={fills}
        cursorT={cursorT}
        peakTime={bundle.peakTime}
        onScrubTo={jumpTo}
      />

      <div className="panel panel-pad">
        <div className="between">
          <div className="label">Replay · {clock(cursorT)} UTC</div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn ghost sm" type="button" onClick={() => setPlaying((p) => !p)}>
              {playing ? "Pause" : "Play day"}
            </button>
            {bundle.peakTime != null && (
              <button className="btn ghost sm" type="button" onClick={() => jumpTo(bundle.peakTime!)}>
                Jump to peak
              </button>
            )}
            <button className="btn ghost sm" type="button" onClick={() => jumpTo(curve[curve.length - 1].t)}>
              End of day
            </button>
          </div>
        </div>

        <p className="readout">
          At {clock(cursorT)} you were{" "}
          <span className={cn("mono", point.total >= 0 ? "up" : "down")}>{usd(point.total)}</span> on the day.
        </p>

        <p className="dim" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6 }}>
          <span className="mono">{usd(point.realized)}</span> banked ·{" "}
          <span className="mono">{usd(point.unrealized)}</span> still open
          {givingBack > 5 && (
            <>
              {" "}
              · peaked <span className="mono mint">{usd(peakSoFar)}</span>, giving back{" "}
              <span className="mono down">{usd(-givingBack)}</span>
            </>
          )}
        </p>

        {openThread && (
          <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6 }}>
            <span className={cn("pill", openThread.bias === "long" ? "long" : "short")}>
              {openThread.coin} {openThread.bias}
            </span>{" "}
            <span className="dim">
              held {hold(cursorT - openThread.openTime)}
              {openThread.closeTime
                ? ` · closed ${usd(openThread.realized)}`
                : " · still open at this point"}
            </span>
          </p>
        )}

        {nextFill && (
          <p className="dim" style={{ margin: "8px 0 0", fontSize: 13 }}>
            Next: {nextFill.dir} {nextFill.coin} at {clock(nextFill.time)} (
            {hold(nextFill.time - cursorT)} later)
          </p>
        )}

        <input
          className="range"
          style={{ marginTop: 18, ["--pct" as string]: `${pct}%` }}
          type="range"
          min={0}
          max={Math.max(0, curve.length - 1)}
          value={Math.min(idx, curve.length - 1)}
          onChange={(e) => {
            setIdx(Number(e.target.value));
            setPlaying(false);
          }}
          aria-label="Scrub the trading day"
        />
        <div className="between" style={{ marginTop: 6 }}>
          <span className="mono label">{clock(curve[0].t)}</span>
          <span className="mono label">{clock(curve[curve.length - 1].t)}</span>
        </div>
      </div>

      <Tape fills={fills} activeId={lastFill?.id ?? null} onPick={(f: Fill) => jumpTo(f.time)} />
    </div>
  );
}
