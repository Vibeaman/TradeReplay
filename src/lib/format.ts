export function usd(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const rounded = Number(abs.toFixed(digits));
  // never print "−$0"
  if (rounded === 0) {
    return `$${(0).toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  }
  const sign = n > 0 ? "+" : "−";
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function plain(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function px(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(5);
}

export function clock(ms: number) {
  return new Date(ms).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function dayLabel(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function hold(ms: number) {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function shortAddr(a: string) {
  if (!a || a === "demo" || a === "hidden") return a || "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function tone(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "";
  if (Math.abs(n) < 0.5) return "";
  return n > 0 ? "up" : "down";
}
