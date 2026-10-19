import { NextResponse } from "next/server";
import { checkPurchase } from "@/lib/policy";
import { addEntry, getEntry, listEntries, spentThisMonth } from "@/lib/ledger";
import { createOrder } from "@/lib/paypal-orders";

export async function POST(request: Request) {
  try {
    const { proposalId } = await request.json();
    const entry = getEntry(String(proposalId ?? ""));
    if (!entry || entry.type !== "proposal") {
      return NextResponse.json({ ok: false, error: "Unknown proposal" }, { status: 404 });
    }
    const { product } = entry.detail as { product: any };

    const alreadyBought = listEntries().some(
      (e) => e.type === "purchase" && (e.detail as any)?.proposalId === entry.id
    );
    if (alreadyBought) {
      return NextResponse.json({ ok: false, error: "Already purchased" }, { status: 409 });
    }

    // Re-check the policy on the server. The browser's numbers are never trusted.
    const policy = checkPurchase(product, spentThisMonth());
    if (!policy.allowed) {
      return NextResponse.json({ ok: false, error: policy.reasons.join(" ") }, { status: 403 });
    }

    const base = process.env.APP_URL ?? new URL(request.url).origin;
    const order = await createOrder({
      proposalId: entry.id,
      title: product.title,
      amount: product.price,
      returnUrl: `${base}/agent/return?proposalId=${entry.id}`,
      cancelUrl: `${base}/agent`,
    });
    addEntry({
      type: "decision",
      summary: `Human approved. PayPal order ${order.orderId} created.`,
      detail: { proposalId: entry.id, orderId: order.orderId },
    });
    return NextResponse.json({ ok: true, ...order });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}