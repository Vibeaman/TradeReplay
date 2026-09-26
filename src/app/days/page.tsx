"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, dayLabel, plain, shortAddr, tone, usd } from "@/lib/format";
import type { ImportSummary } from "@/lib/types";

export default function DaysPage() {
  const router = useRouter();
  const [data, setData] = useState<ImportSummary | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("tr_import");
    if (!raw) {
      setMissing(true);
      return;
    }
    setData(JSON.parse(raw) as ImportSummary);
  }, []);

  if (missing) {
    return (
      <div className="wrap">
        <h2>No history loaded</h2>
        <p className="lede">Import an address first, or open the demo day.</p>
        <div className="row" style={{ marginTop: 18 }}>
          <Link className="btn" href="/">
            Import an address
          </Link>
          <Link className="btn ghost" href="/demo">
            Demo day
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wrap">
        <p className="dim">Reading your tape…</p>
      </div>
    );
  }

  const best = data.days.reduce((m, d) => Math.max(m, Math.abs(d.realized)), 1);

  return (
    <div className="wrap">
      <p className="eyebrow">{shortAddr(data.address)}</p>
      <h1 style={{ fontSize: "clamp(28px,4.6vw,42px)" }}>Pick a day to replay.</h1>

      <div className="stats" style={{ marginTop: 26 }}>
        <div className="stat">
          <div className="label">Equity</div>
          <div className="stat-v mono">{plain(data.equity, 2)}</div>
          <div className="stat-s">account value now</div>
        </div>
        <div className="stat">
          <div className="label">Fills imported</div>
          <div className="stat-v mono">{data.totalFills.toLocaleString()}</div>
          <div className="stat-s">across {data.days.length} days</div>
        </div>
        <div className="stat">
          <div className="label">Week realized</div>
          <div className={cn("stat-v mono", tone(data.weekRealized))}>{usd(data.weekRealized)}</div>
          <div className="stat-s">prior {usd(data.prevWeekRealized)}</div>
        </div>
        <div className="stat">
          <div className="label">Open now</div>
          <div className="stat-v mono">{data.openPositions.length}</div>
          <div className="stat-s">
            {data.openPositions.length
              ? data.openPositions.map((p) => `${p.coin} ${p.lev}×`).join(" · ")
              : "flat"}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 22 }}>
        <div className="panel-pad between" style={{ paddingBottom: 12 }}>
          <h2>Trading days</h2>
          <span className="label">newest first</span>
        </div>
        <hr className="sep" />
        <div className="table-wrap scroll-y" style={{ maxHeight: 520 }}>
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th className="num">Fills</th>
                <th>Assets</th>
                <th className="num">Realized</th>
                <th style={{ width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {data.days.map((d) => (
                <tr
                  key={d.date}
                  data-click="true"
                  onClick={() => router.push(`/day/${d.date}`)}
                >
                  <td>
                    <div style={{ fontWeight: 560 }}>{dayLabel(d.date)}</div>
                    <div className="mono label">{d.date}</div>
                  </td>
                  <td className="mono num dim">{d.fills}</td>
                  <td className="dim" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {d.coins.slice(0, 4).join(", ")}
                    {d.coins.length > 4 ? ` +${d.coins.length - 4}` : ""}
                  </td>
                  <td className={cn("mono num", tone(d.realized))}>{usd(d.realized)}</td>
                  <td>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: d.realized >= 0 ? "var(--up)" : "var(--down)",
                        width: `${Math.max(8, (Math.abs(d.realized) / best) * 100)}%`,
                        opacity: 0.75,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
