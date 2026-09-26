"use client";

import { RULES, countByKind, totalLeak } from "@/lib/labels";
import { clock, cn, hold, plain, tone, usd } from "@/lib/format";
import type { DayBundle, MistakeKind } from "@/lib/types";

const ORDER: MistakeKind[] = ["revenge", "over_leverage", "late_exit", "loss_after_win"];

export function Analytics({ bundle }: { bundle: DayBundle }) {
  const counts = countByKind(bundle.mistakes);
  const leak = totalLeak(bundle.mistakes);
  const weekDelta =
    bundle.weekRealized != null && bundle.prevWeekRealized != null
      ? bundle.weekRealized - bundle.prevWeekRealized
      : null;

  return (
    <div className="grid">
      <div className="stats">
        {ORDER.map((k) => (
          <div className="stat" key={k}>
            <div className="label">{RULES[k].label}</div>
            <div className={cn("stat-v mono", counts[k] > 0 ? "down" : "dim")}>{counts[k]}</div>
            <div className="stat-s">{counts[k] === 1 ? "occurrence" : "occurrences"}</div>
          </div>
        ))}
      </div>

      <div className="cols two">
        <div className="panel">
          <div className="panel-pad between" style={{ paddingBottom: 12 }}>
            <h2>What it cost</h2>
            {leak > 0 && <span className="pill mintline">{plain(leak)} left on the table</span>}
          </div>
          <hr className="sep" />
          {bundle.mistakes.length === 0 ? (
            <div className="panel-pad dim" style={{ fontSize: 14 }}>
              Nothing tripped a rule on this day. Clean tape.
            </div>
          ) : (
            <div>
              {bundle.mistakes.map((m, i) => (
                <div className="mistake" key={`${m.kind}-${i}`}>
                  <span
                    className="mistake-bar"
                    style={{
                      background: m.costUsd && m.costUsd > 0 ? "var(--down)" : "var(--mint)",
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>{m.label}</strong>
                      <span className="mono label">{clock(m.time)}</span>
                      {m.costUsd != null && m.costUsd > 0 && (
                        <span className="mono down" style={{ fontSize: 12.5 }}>
                          −{plain(m.costUsd)}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "5px 0 0", fontSize: 13.5, color: "var(--text)" }}>{m.detail}</p>
                    <p className="dim" style={{ margin: "4px 0 0", fontSize: 12 }}>
                      Rule: {m.rule}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid">
          <div className="panel panel-pad">
            <div className="label">Day</div>
            <div className={cn("stat-v mono", tone(bundle.realized))}>{usd(bundle.realized)}</div>
            <div className="stat-s">
              realized · {plain(bundle.fees, 2)} fees · peak {usd(bundle.peakTotal)}
            </div>
            <hr className="sep" style={{ margin: "14px 0" }} />
            <div className="label">This week vs prior</div>
            <p style={{ margin: "7px 0 0", fontSize: 14 }}>
              <span className={cn("mono", tone(bundle.weekRealized))}>{usd(bundle.weekRealized)}</span>{" "}
              <span className="dim">vs</span>{" "}
              <span className={cn("mono", tone(bundle.prevWeekRealized))}>{usd(bundle.prevWeekRealized)}</span>
            </p>
            {weekDelta != null && (
              <p className="dim" style={{ margin: "4px 0 0", fontSize: 12.5 }}>
                diff <span className={cn("mono", tone(weekDelta))}>{usd(weekDelta)}</span>
              </p>
            )}
            {bundle.truncatedMistakes > 0 && (
              <p className="dim" style={{ margin: "12px 0 0", fontSize: 12 }}>
                Showing the costliest flags. {bundle.truncatedMistakes} more matched the same rules.
              </p>
            )}
            {bundle.markedCoins.length < bundle.tradedCoins.length && (
              <p className="dim" style={{ margin: "10px 0 0", fontSize: 12 }}>
                Marks loaded for {bundle.markedCoins.length} of {bundle.tradedCoins.length} assets, biggest
                notional first. Open P&amp;L and late exits are only judged on those. Realized is exact for
                all of them.
              </p>
            )}
            {!bundle.hasMarks && (
              <p className="dim" style={{ margin: "12px 0 0", fontSize: 12 }}>
                No candles came back for these assets, so open P&amp;L shows as zero. Realized is exact.
              </p>
            )}
          </div>

          <div className="panel">
            <div className="panel-pad" style={{ paddingBottom: 12 }}>
              <h2>Positions</h2>
            </div>
            <hr className="sep" />
            <div className="table-wrap" style={{ maxHeight: 300, overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Held</th>
                    <th className="num">Peak</th>
                    <th className="num">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {bundle.threads.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={cn("pill", t.bias === "long" ? "long" : "short")}>{t.coin}</span>
                      </td>
                      <td className="mono dim">{hold(t.holdMs)}</td>
                      <td className="mono num mint">
                        {t.hasMark ? usd(t.peakUnrealized) : <span className="dim">no mark</span>}
                      </td>
                      <td className={cn("mono num", tone(t.realized))}>{usd(t.realized)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
