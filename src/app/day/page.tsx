"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Analytics } from "@/components/Analytics";
import { Replay } from "@/components/Replay";
import { shortAddr, usd } from "@/lib/format";
import type { DayBundle } from "@/lib/types";

export default function DayPage() {
  const [bundle, setBundle] = useState<DayBundle | null>(null);
  const [tab, setTab] = useState<"replay" | "analytics">("replay");
  const [share, setShare] = useState<string | null>(null);
  const [blur, setBlur] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("tr_bundle");
    if (raw) setBundle(JSON.parse(raw) as DayBundle);
  }, []);

  if (!bundle) {
    return (
      <div className="wrap">
        <p>No tape loaded.</p>
        <Link href="/">Import an address</Link> or <Link href="/demo">open the demo day</Link>.
      </div>
    );
  }

  async function shareDay() {
    const r = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bundle, blur }),
    });
    const j = await r.json();
    if (j.id) setShare(`${window.location.origin}/share/${j.id}`);
  }

  return (
    <div className="wrap">
      <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)" }}>
        {bundle.demo ? "Demo Monday" : shortAddr(bundle.address)} · day PnL {usd(bundle.dayPnl)} · equity {usd(bundle.equity)}
      </p>
      <h1 className="display" style={{ fontSize: 40, margin: "8px 0 16px" }}>The tape.</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button className={tab === "replay" ? "btn" : "btn ghost"} type="button" onClick={() => setTab("replay")}>
          Replay
        </button>
        <button className={tab === "analytics" ? "btn" : "btn ghost"} type="button" onClick={() => setTab("analytics")}>
          Analytics
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
          <input type="checkbox" checked={blur} onChange={(e) => setBlur(e.target.checked)} />
          Blur address on share
        </label>
        <button className="btn ghost" type="button" onClick={() => void shareDay()}>
          Share this day
        </button>
      </div>
      {share && (
        <p className="mono" style={{ fontSize: 13 }}>
          <a href={share}>{share}</a>
        </p>
      )}
      {tab === "replay" ? <Replay bundle={bundle} /> : <Analytics bundle={bundle} />}
    </div>
  );
}
