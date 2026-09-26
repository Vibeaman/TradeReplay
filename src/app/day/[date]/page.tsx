"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Analytics } from "@/components/Analytics";
import { Replay } from "@/components/Replay";
import { cn, dayLabel, plain, shortAddr, tone, usd } from "@/lib/format";
import type { DayBundle } from "@/lib/types";

export default function DayPage() {
  const params = useParams<{ date: string }>();
  const date = params?.date ?? "";
  const [bundle, setBundle] = useState<DayBundle | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"replay" | "analytics">("replay");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [blur, setBlur] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const demo = date === "demo";
        const addr = sessionStorage.getItem("tr_addr") ?? "";
        const qs = demo ? "demo=1" : `user=${encodeURIComponent(addr)}&date=${encodeURIComponent(date)}`;
        const r = await fetch(`/api/day?${qs}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Could not load that day.");
        setBundle(j as DayBundle);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Could not load that day.");
      }
    })();
  }, [date]);

  async function share() {
    if (!bundle) return;
    setSharing(true);
    try {
      const r = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bundle, blur }),
      });
      const j = await r.json();
      if (j.id) setShareUrl(`${window.location.origin}/share/${j.id}`);
    } finally {
      setSharing(false);
    }
  }

  if (err) {
    return (
      <div className="wrap">
        <h2>{err}</h2>
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn ghost" href="/days">
            Back to days
          </Link>
          <Link className="btn" href="/demo">
            Demo day
          </Link>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="wrap">
        <p className="dim">Rebuilding the day from marks…</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="between">
        <div>
          <p className="eyebrow">
            {bundle.demo ? "Demo tape" : shortAddr(bundle.address)} · {bundle.date}
          </p>
          <h1 style={{ fontSize: "clamp(26px,4.2vw,38px)" }}>{dayLabel(bundle.date)}</h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="label">Closed the day</div>
          <div className={cn("stat-v mono", tone(bundle.realized))}>{usd(bundle.realized)}</div>
          <div className="stat-s">peak {usd(bundle.peakTotal)}</div>
        </div>
      </div>

      <div className="row" style={{ marginTop: 20, justifyContent: "space-between" }}>
        <div className="seg">
          <button type="button" data-on={tab === "replay"} onClick={() => setTab("replay")}>
            Replay
          </button>
          <button type="button" data-on={tab === "analytics"} onClick={() => setTab("analytics")}>
            Mistakes
          </button>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <label className="dim row" style={{ gap: 6, fontSize: 12.5 }}>
            <input type="checkbox" checked={blur} onChange={(e) => setBlur(e.target.checked)} />
            hide address
          </label>
          <button className="btn ghost sm" type="button" onClick={() => void share()} disabled={sharing}>
            {sharing ? "Creating link…" : "Share this day"}
          </button>
          <Link className="btn ghost sm" href={bundle.demo ? "/" : "/days"}>
            {bundle.demo ? "Import mine" : "All days"}
          </Link>
        </div>
      </div>

      {shareUrl && (
        <div className="panel panel-pad" style={{ marginTop: 14 }}>
          <div className="label">Read-only link</div>
          <a className="mono mint" href={shareUrl} style={{ fontSize: 13 }}>
            {shareUrl}
          </a>
          <p className="dim" style={{ fontSize: 12, margin: "6px 0 0" }}>
            Lives in server memory for this deployment. Swap for a KV store before you lean on it.
          </p>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {tab === "replay" ? <Replay bundle={bundle} /> : <Analytics bundle={bundle} />}
      </div>

      <p className="dim" style={{ fontSize: 12, marginTop: 22 }}>
        {bundle.fills.length} fills · {bundle.tradedCoins.length} assets · fees {plain(bundle.fees, 2)}
        {bundle.equity != null ? ` · equity ${plain(bundle.equity, 2)}` : ""}
      </p>
    </div>
  );
}
