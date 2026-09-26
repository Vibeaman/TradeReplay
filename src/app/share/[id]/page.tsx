"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Analytics } from "@/components/Analytics";
import { Replay } from "@/components/Replay";
import { shortAddr, usd } from "@/lib/format";
import type { DayBundle } from "@/lib/types";

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<DayBundle | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await fetch(`/api/share?id=${id}`);
      const j = await r.json();
      if (!r.ok) setErr(j.error || "not found");
      else setBundle(j);
    })();
  }, [id]);

  if (err) return <div className="wrap">{err}</div>;
  if (!bundle) return <div className="wrap">Loading share…</div>;

  return (
    <div className="wrap">
      <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)" }}>
        Shared day · {shortAddr(bundle.address)} · {usd(bundle.dayPnl)}
      </p>
      <h1 className="display" style={{ fontSize: 36 }}>Read-only tape.</h1>
      <Replay bundle={bundle} />
      <div style={{ height: 24 }} />
      <Analytics bundle={bundle} />
    </div>
  );
}
