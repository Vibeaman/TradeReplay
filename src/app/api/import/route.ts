import { NextResponse } from "next/server";
import { loadImport } from "@/lib/bundle";
import { demoImport } from "@/lib/demo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get("user") ?? "";
  if (url.searchParams.get("demo") === "1" || user.toLowerCase() === "demo") {
    return NextResponse.json(demoImport());
  }
  try {
    return NextResponse.json(await loadImport(user));
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed." },
      { status: 400 },
    );
  }
}
