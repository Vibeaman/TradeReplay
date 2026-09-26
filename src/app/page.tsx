"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RULES } from "@/lib/labels";

export default function Landing() {
  const router = useRouter();
  const [addr, setAddr] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/import?user=${encodeURIComponent(addr.trim())}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Import failed.");
      sessionStorage.setItem("tr_import", JSON.stringify(j));
      sessionStorage.setItem("tr_addr", j.address);
      router.push("/days");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Import failed.");
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <p className="eyebrow">Hyperliquid · read only</p>
      <h1>
        Every fill is a commit.
        <br />
        <span className="mint">Replay your trading day.</span>
      </h1>
      <p className="lede">
        TradeReplay imports your Hyperliquid fills and rebuilds the day minute by minute from real mark
        prices. Scrub to any moment and see what you were actually holding, what it was worth, and where
        you gave it back.
      </p>

      <form onSubmit={submit} style={{ marginTop: 30, maxWidth: 560 }} className="grid">
        <input
          type="text"
          className="mono"
          required
          placeholder="0x… your Hyperliquid account address"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          spellCheck={false}
        />
        <div className="row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Importing fills…" : "Import my history"}
          </button>
          <Link className="btn ghost" href="/demo">
            Open the demo day
          </Link>
        </div>
        {err && (
          <p className="down" style={{ fontSize: 13.5, margin: 0 }}>
            {err}
          </p>
        )}
        <p className="dim" style={{ fontSize: 12.5, margin: 0 }}>
          Use the account address you trade from. Agent and API wallets return no fills. We never ask for a
          key and cannot place orders.
        </p>
      </form>

      <div style={{ marginTop: 56 }} className="grid">
        <div className="between">
          <h2>The four rules</h2>
          <span className="label">published, not predicted</span>
        </div>
        <div className="stats">
          {(["revenge", "over_leverage", "late_exit", "loss_after_win"] as const).map((k) => (
            <div className="stat" key={k}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--mint)" }}>{RULES[k].label}</div>
              <p className="dim" style={{ fontSize: 12.5, margin: "7px 0 0", lineHeight: 1.5, whiteSpace: "normal" }}>
                {RULES[k].rule}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 44 }} className="cols two">
        <div className="panel panel-pad">
          <div className="label">How the replay is built</div>
          <ol className="dim" style={{ fontSize: 14, lineHeight: 1.75, paddingLeft: 18, margin: "10px 0 0" }}>
            <li>
              <span style={{ color: "var(--text)" }}>Fills</span> come from{" "}
              <span className="mono">userFills</span> and <span className="mono">userFillsByTime</span>.
            </li>
            <li>
              Positions are walked from signed size and <span className="mono">startPosition</span>, flat to
              flat.
            </li>
            <li>
              <span style={{ color: "var(--text)" }}>Marks</span> come from{" "}
              <span className="mono">candleSnapshot</span>, so open P&amp;L is real, not guessed.
            </li>
            <li>Rules run over that curve. Every label shows its own definition.</li>
          </ol>
        </div>
        <div className="panel panel-pad">
          <div className="label">Not a bot</div>
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: "10px 0 0" }}>
            TradeReplay does not predict price and cannot trade. It only reconstructs what already happened,
            so the numbers are checkable against your own Hyperliquid history.
          </p>
        </div>
      </div>
    </div>
  );
}
