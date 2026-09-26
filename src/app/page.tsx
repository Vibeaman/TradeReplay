"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [addr, setAddr] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/hl?user=${encodeURIComponent(addr.trim())}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "import failed");
      sessionStorage.setItem("tr_bundle", JSON.stringify(j));
      router.push("/day");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "import failed");
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <p style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)" }}>
        Hyperliquid · tape, not vibes
      </p>
      <h1 className="display" style={{ fontSize: "clamp(40px, 8vw, 72px)", lineHeight: 0.95, margin: "12px 0 16px" }}>
        GitHub for trading.
      </h1>
      <p style={{ fontSize: 18, color: "var(--muted)", maxWidth: 560 }}>
        Every fill is a commit. Replay the day. Mistakes are labeled from the tape — revenge, over-leverage, late exits, green days that flipped.
      </p>
      <form onSubmit={go} style={{ marginTop: 28, display: "grid", gap: 10, maxWidth: 520 }}>
        <input
          required
          placeholder="0x… Hyperliquid account (not an agent wallet)"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          className="mono"
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" disabled={busy} type="submit">
            {busy ? "Importing…" : "Import history"}
          </button>
          <Link href="/demo" className="btn ghost">
            Open demo day
          </Link>
        </div>
        {err && <p className="down">{err}</p>}
      </form>
      <ol style={{ marginTop: 48, color: "var(--muted)", lineHeight: 1.7, paddingLeft: 18 }}>
        <li>Connect the account address.</li>
        <li>We pull fills, portfolio buckets, and open leverage from Hyperliquid.</li>
        <li>Timeline → replay scrubber → analytics. Share a day if you want.</li>
      </ol>
    </div>
  );
}
