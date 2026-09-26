# TradeReplay

**GitHub for trading.** Replay Hyperliquid days. Mistakes labeled from the tape, not vibes.

Repo: https://github.com/Vibeaman/TradeReplay

## Flow

Landing → account address → import Hyperliquid history → timeline → replay → analytics → optional share link.

Demo day (no wallet): `/demo`

## Hyperliquid

Server routes call `POST https://api.hyperliquid.xyz/info`:

- `userFills` / `userFillsByTime` — the tape
- `clearinghouseState` — equity + open leverage
- `portfolio` — day / week PnL buckets

Use the **account** address, not an agent wallet.

## Labels (rules, not an LLM)

| Kind | Rule |
|---|---|
| Revenge | New open within 20m of a losing fill |
| Over-leverage | Fill notional / equity ≥ 12× |
| Late exit | Close ≥ $40 under peak running PnL on the thread |
| Loss after winning | Day peaked ≥ $20 green, finished red |

## Stack

Next.js 15 · TypeScript · Hyperliquid public info API · in-memory share links (swap for KV later)

Not financial advice. Not a trading bot.
