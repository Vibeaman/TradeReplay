import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeReplay — GitHub for trading",
  description: "Replay Hyperliquid days. Mistakes labeled from the tape, not vibes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="nav">
          <Link href="/" className="display" style={{ fontSize: 22 }}>
            TradeReplay
          </Link>
          <nav style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--muted)" }}>
            <Link href="/demo">Demo day</Link>
            <a href="https://github.com/Vibeaman/TradeReplay">GitHub</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
