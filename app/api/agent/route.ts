import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";

async function handle(message: string) {
  if (!message.trim()) {
    return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
  }
  try {
    const result = await runAgent(message.trim());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return handle(typeof body?.message === "string" ? body.message : "");
}

// Handy for testing in the browser: /api/agent?message=...
export async function GET(request: Request) {
  return handle(new URL(request.url).searchParams.get("message") ?? "");
}