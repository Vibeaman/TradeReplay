# TradeReplay

**GitHub for trading.** Connect Hyperliquid, and every fill becomes a commit. Replay the day minute by
minute from real mark prices, then see the mistakes priced from the tape.

Repo: https://github.com/Vibeaman/TradeReplay

## The flow

Landing → paste account address → import fills → pick a day → replay → mistakes → optional share link.

No wallet needed to look around: **`/demo`** loads a fixed day.

## Why it is not a trading bot

TradeReplay never predicts price and cannot place an order. It only reconstructs what already happened, so
every number can be checked against your own Hyperliquid history.

## Hyperliquid data

Server routes call `POST https://api.hyperliquid.xyz/info`:

| Request | Used for |
| --- | --- |
| `userFills`, `userFillsByTime` | the tape, paginated backwards |
| `candleSnapshot` | 1m mark prices, so **open P&L is real** |
| `clearinghouseState` | equity, open positions, leverage |
| `portfolio` | week and month realized buckets |

Pass the **account** address. Agent and API wallet addresses return an empty list.

### How a position is rebuilt

Signed size comes from `side` (`B` = buy, `A` = sell) and is cross-checked against `startPosition`. Fills
are walked per asset, tracking position and average entry, and a position is one run from flat back to
flat. Open P&L at any minute is `position × (mark − avgEntry)`.

Marks cost one request per asset, so the largest assets by notional are covered first (14 per day). Assets
without marks show `no mark` instead of a fake zero, and are excluded from late-exit judgement. Realized
P&L is exact for every asset.

## The four rules

Published, not predicted. Each label shows its own definition in the UI.

| Rule | Fires when |
| --- | --- |
| Revenge trading | Within 20 minutes of a **material** loss, size went back on at equal or larger notional |
| Over-leverage | Position notional reached 12× account equity |
| Late exit | Closed at least $40 below the best mark-to-market the position reached |
| Loss after winning | Day was $50+ in profit, then finished red |

"Material" scales with the account: `max($25, 0.2% of equity)`. Without it, a market maker scratching
$0.70 hundreds of times would light up every rule.

## Design

Hyperliquid brand palette: mint `#97FCE4` on near-black `#04060C`, with `#50D2C1` for pressed states.
Inter for the interface, JetBrains Mono for every number.

## Run it

```bash
npm install
npm run dev
```

No environment variables. The Hyperliquid info API is public and read-only.

## Known limits

- Share links live in server memory, so a redeploy clears them. Swap in a KV store to keep them.
- Hyperliquid serves roughly the last 10,000 fills.
- Days are bucketed in UTC.

Not financial advice.
