export function usd(n: number | null | undefined, d = 0) {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}$${n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

export function clock(ms: number) {
  return new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
}

export function hold(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function shortAddr(a: string) {
  if (!a || a === "demo") return "demo";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
