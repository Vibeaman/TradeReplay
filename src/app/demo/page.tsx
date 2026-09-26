"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const router = useRouter();
  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/hl?demo=1");
      const j = await r.json();
      sessionStorage.setItem("tr_bundle", JSON.stringify(j));
      router.replace("/day");
    })();
  }, [router]);
  return (
    <div className="wrap">
      <p style={{ color: "var(--muted)" }}>Loading Monday…</p>
    </div>
  );
}
