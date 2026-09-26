import { NextResponse } from "next/server";
import { loadDay } from "@/lib/bundle";
import { demoDay } from "@/lib/demo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get("user") ?? "";
  const date = url.searchParams.get("date") ?? "";
  if (url.searchParams.get("demo") === "1" || user.toLowerCase() === "demo") {
    return NextResponse.json(demoDay());
  }
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Pick a day first.");
    return NextResponse.json(await loadDay(user, date));
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load that day." },
      { status: 400 },
    );
  }
}
