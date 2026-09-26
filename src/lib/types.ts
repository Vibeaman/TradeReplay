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

export type HlPosition = {
  coin: string;
  szi: string;
  leverage?: { type?: string; value?: number };
  entryPx?: string;
  positionValue?: string;
  unrealizedPnl?: string;
  liquidationPx?: string | null;
  marginUsed?: string;
  maxLeverage?: number;
};

export type HlClearinghouse = {
  marginSummary?: {
    accountValue?: string;
    totalNtlPos?: string;
    totalMarginUsed?: string;
  };
  assetPositions?: Array<{
    type?: string;
    position: HlPosition;
  }>;
  time?: number;
};

export type PortfolioBucket = {
  accountValueHistory: [number, string][];
  pnlHistory: [number, string][];
  vlm?: string;
};

export type TapeEvent = {
  id: string;
  time: number;
  coin: string;
  dir: string;
  side: "long" | "short" | "flat";
  px: number;
  sz: number;
  closedPnl: number;
  fee: number;
  startPosition: number;
  hash: string;
  oid: number;
};

export type PositionThread = {
  id: string;
  coin: string;
  side: "long" | "short";
  openTime: number;
  closeTime: number | null;
  fills: TapeEvent[];
  closedPnl: number;
  peakUnrealized: number;
  holdMs: number;
  lateExitUsd: number;
};

export type MistakeKind =
  | "revenge"
  | "over_leverage"
  | "late_exit"
  | "loss_after_win";

export type Mistake = {
  kind: MistakeKind;
  label: string;
  definition: string;
  time: number;
  coin: string;
  detail: string;
  fillId?: string;
  threadId?: string;
};

export type DayBundle = {
  address: string;
  demo: boolean;
  asOf: number;
  fills: TapeEvent[];
  threads: PositionThread[];
  mistakes: Mistake[];
  equity: number | null;
  weekPnl: number | null;
  dayPnl: number | null;
  prevWeekPnl: number | null;
  openLeverage: Array<{ coin: string; lev: number; uPnl: number }>;
};
