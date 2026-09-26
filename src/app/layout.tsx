import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeReplay — GitHub for trading",
  description:
    "Connect Hyperliquid. Every fill becomes a commit. Replay the day and see the mistakes, priced from the tape.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;560;600;650&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              <span className="brand-dot" />
              Trade<em>Replay</em>
            </Link>
            <nav className="topnav">
              <Link href="/demo">Demo day</Link>
              <Link href="/days">My days</Link>
              <a href="https://github.com/Vibeaman/TradeReplay" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </nav>
          </div>
        </div>
        {children}
        <footer className="foot">
          <div className="inner">
            <span>Reads Hyperliquid. Never trades for you.</span>
            <span>Mistake rules are published, not predicted.</span>
            <span>Not financial advice.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
