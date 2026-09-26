"use client";

import { useMemo, useState } from "react";
import { clock, hold, usd } from "@/lib/format";
import type { DayBundle } from "@/lib/types";
import { Tape } from "./Tape";

export function Replay({ bundle }: { bundle: DayBundle }) {
  const fills = bundle.fills;
  const [i, setI] = useState(Math.max(0, fills.length - 1));
  const cur = fills[i];
  const running = useMemo(() => fills.slice(0, i + 1).reduce((s, f) => s + f.closedPnl, 0), [fills, i]);
  const peak = useMemo(() => {
    let p = 0;
    let r = 0;
    for (const f of fills.slice(0, i + 1)) {
      r += f.closedPnl;
      if (r > p) p = r;
    }
    return p;
  }, [fills, i]);

  const thread = bundle.threads.find((t) => t.fills.some((f) => f.id === cur?.id));
  const held = thread && cur ? cur.time - thread.openTime : 0;

  if (!cur) return <p style={{ color: "var(--muted)" }}>No fills.</p>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="panel" style={{ padding: 16 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", margin: 0 }}>
          Replay · {clock(cur.time)} UTC
        </p>
        <p className="display" style={{ fontSize: 28, margin: "8px 0 0" }}>
          At {clock(cur.time)} you had {usd(running)} realized on the tape.
        </p>
        {peak > running + 20 && (
          <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>
            Peak so far {usd(peak)}. You gave some back.
          </p>
        )}
        {thread && (
          <p style={{ margin: "8px 0 0" }}>
            {thread.coin} {thread.side}. Held {hold(held)}.
            {thread.closeTime ? ` Closed ${usd(thread.closedPnl)}.` : " Still open."}
            {thread.lateExitUsd > 40 ? ` Late exit vs peak: ${usd(-thread.lateExitUsd)}.` : ""}
          </p>
        )}
        <input
          type="range"
          min={0}
          max={fills.length - 1}
          value={i}
          onChange={(e) => setI(Number(e.target.value))}
          style={{ marginTop: 16 }}
        />
      </div>
      <Tape fills={fills} activeId={cur.id} onPick={(id) => setI(fills.findIndex((f) => f.id === id))} />
    </div>
  );
}
