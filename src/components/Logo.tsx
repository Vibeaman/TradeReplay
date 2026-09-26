"use client";

/**
 * TradeReplay mark: "Peak".
 * The shape of a day that ran up, topped out, and gave it back.
 * Hyperliquid's mark flows; this one is built from time and price, so it stays angular.
 */

const MINT = "#97fce4";

export function Mark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 24 L11 24 L16.5 7 L22 19 L29 19"
        fill="none"
        stroke={MINT}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16.5" cy="7" r="3" fill={MINT} />
    </svg>
  );
}

/** Header lockup. */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="logo">
      <Mark size={size} />
      <span className="logo-word">
        Trade<em>Replay</em>
      </span>
    </span>
  );
}
