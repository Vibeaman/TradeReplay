import { NextResponse } from "next/server";
import type { DayBundle } from "@/lib/types";

const g = globalThis as unknown as { __trShares?: Map<string, DayBundle> };
if (!g.__trShares) g.__trShares = new Map();

export async function POST(req: Request) {
  const body = (await req.json()) as { bundle?: DayBundle; blur?: boolean };
  if (!body.bundle) return NextResponse.json({ error: "missing bundle" }, { status: 400 });
  const id = crypto.randomUUID().slice(0, 8);
  const bundle = structuredClone(body.bundle);
  if (body.blur) {
    bundle.address = bundle.demo ? "demo" : "hidden";
    bundle.equity = null;
  }
  g.__trShares!.set(id, bundle);
  return NextResponse.json({ id });
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const bundle = g.__trShares?.get(id);
  if (!bundle) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(bundle);
}
