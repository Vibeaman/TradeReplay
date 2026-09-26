import { NextResponse } from "next/server";
import { loadBundle } from "@/lib/bundle";
import { demoBundle } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get("user") ?? "";
  const demo = url.searchParams.get("demo") === "1";
  try {
    if (demo || user.toLowerCase() === "demo") {
      return NextResponse.json(demoBundle());
    }
    const bundle = await loadBundle(user);
    return NextResponse.json(bundle);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "import failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
