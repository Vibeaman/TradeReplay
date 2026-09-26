"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DemoRedirect() {
  const router = useRouter();
  useEffect(() => {
    sessionStorage.setItem("tr_addr", "demo");
    router.replace("/day/demo");
  }, [router]);
  return (
    <div className="wrap">
      <p className="dim">Loading Monday…</p>
    </div>
  );
}
