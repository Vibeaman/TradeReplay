export type HlFill = {
  coin: string;
  px: string;
  sz: string;
  side: "A" | "B" | string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken?: string;
};

export type HlCandle = {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
};

export type HlClearinghouse = {
  marginSummary?: { accountValue?: string; totalNtlPos?: string; totalMarginUsed?: string };
  assetPositions?: Array<{
    type?: string;
    position: {
      coin: string;
      szi: string;
      leverage?: { type?: string; value?: number };
      entryPx?: string;
      unrealizedPnl?: string;
      positionValue?: string;
    };
  }>;
};

export type PortfolioBucket = {
  accountValueHistory: [number, string][];
  pnlHistory: [number, string][];
  vlm?: string;
};

/** One fill, normalized. */
export type Fill = {
  id: string;
  time: number;
  coin: string;
  dir: string;
  action: "open" | "close" | "other";
  bias: "long" | "short" | "flat";
  px: number;
  sz: number;
  signedSz: number;
  closedPnl: number;
  fee: number;
  hash: string;
  oid: number;
};

/** A position from flat to flat. Like a commit thread. */
export type Thread = {
  id: string;
  coin: string;
  bias: "long" | "short";
  openTime: number;
  closeTime: number | null;
  fills: Fill[];
  realized: number;
  fees: number;
  peakUnrealized: number;
  peakTime: number | null;
  troughUnrealized: number;
  holdMs: number;
  gaveBack: number;
  maxNotional: number;
  hasMark: boolean;
};

export type CurvePoint = {
  t: number;
  realized: number;
  unrealized: number;
  total: number;
};

export type MistakeKind = "revenge" | "over_leverage" | "late_exit" | "loss_after_win";

export type Mistake = {
  kind: MistakeKind;
  label: string;
  rule: string;
  time: number;
  coin: string;
  detail: string;
  costUsd: number | null;
  threadId?: string;
};

export type DaySummary = {
  date: string;
  start: number;
  end: number;
  realized: number;
  fills: number;
  coins: string[];
};

export type DayBundle = {
  address: string;
  demo: boolean;
  date: string;
  dayStart: number;
  dayEnd: number;
  fills: Fill[];
  threads: Thread[];
  curve: CurvePoint[];
  mistakes: Mistake[];
  realized: number;
  fees: number;
  peakTotal: number;
  peakTime: number | null;
  equity: number | null;
  weekRealized: number | null;
  prevWeekRealized: number | null;
  tradedCoins: string[];
  hasMarks: boolean;
  markedCoins: string[];
  truncatedMistakes: number;
};

export type ImportSummary = {
  address: string;
  equity: number | null;
  totalFills: number;
  days: DaySummary[];
  weekRealized: number | null;
  prevWeekRealized: number | null;
  openPositions: Array<{ coin: string; szi: number; lev: number; uPnl: number }>;
};
