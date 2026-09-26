"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Analytics } from "@/components/Analytics";
import { Replay } from "@/components/Replay";
import { cn, dayLabel, shortAddr, tone, usd } from "@/lib/format";
import type { DayBundle } from "@/lib/types";

export default function SharedDay() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [bundle, setBundle] = useState<DayBundle | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await fetch(`/api/share?id=${encodeURIComponent(id)}`);
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "That link has expired.");
      else setBundle(j as DayBundle);
    })();
  }, [id]);

  if (err) {
    return (
      <div className="wrap">
        <h2>{err}</h2>
        <p className="lede">Share links live in server memory, so a redeploy clears them.</p>
        <Link className="btn" href="/demo" style={{ marginTop: 16 }}>
          Open the demo day
        </Link>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="wrap">
        <p className="dim">Loading shared tape…</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="between">
        <div>
          <p className="eyebrow">Shared · {shortAddr(bundle.address)}</p>
          <h1 style={{ fontSize: "clamp(26px,4.2vw,38px)" }}>{dayLabel(bundle.date)}</h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="label">Closed the day</div>
          <div className={cn("stat-v mono", tone(bundle.realized))}>{usd(bundle.realized)}</div>
        </div>
      </div>
      <div style={{ marginTop: 18 }} className="grid">
        <Replay bundle={bundle} />
        <Analytics bundle={bundle} />
      </div>
    </div>
  );
}
