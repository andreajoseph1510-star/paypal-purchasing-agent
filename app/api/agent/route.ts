import { NextResponse } from "next/server";
import { runAgent, type Proposal } from "@/lib/agent";
import { addEntry } from "@/lib/ledger";

async function handle(message: string) {
  if (!message.trim()) {
    return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
  }
  try {
    const result = await runAgent(message.trim());

    // The cast tells TypeScript the proposal can be set by the agent's tools.
    const proposal = result.proposal as Proposal | null;

    // The server keeps its own copy of the proposal. The checkout routes read the
    // price from here, never from the browser.
    let proposalId: string | null = null;
    if (proposal) {
      const entry = addEntry({
        type: "proposal",
        summary: `Proposed ${proposal.product.title} at $${proposal.product.price.toFixed(2)}`,
        detail: proposal,
      });
      proposalId = entry.id;
    }

    return NextResponse.json({ ok: true, ...result, proposalId });
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