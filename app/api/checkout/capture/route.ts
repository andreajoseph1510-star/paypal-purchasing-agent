import { NextResponse } from "next/server";
import { checkPurchase } from "@/lib/policy";
import { addEntry, getEntry, listEntries, spentThisMonth } from "@/lib/ledger";
import { captureOrder, getOrder } from "@/lib/paypal-orders";

export async function POST(request: Request) {
  try {
    const { orderId, proposalId } = await request.json();
    const entry = getEntry(String(proposalId ?? ""));
    if (!orderId || !entry || entry.type !== "proposal") {
      return NextResponse.json({ ok: false, error: "Unknown order or proposal" }, { status: 404 });
    }
    const { product } = entry.detail as { product: any };

    // Safe to call twice (page refresh): return the purchase we already recorded.
    const existing = listEntries().find(
      (e) => e.type === "purchase" && (e.detail as any)?.orderId === orderId
    );
    if (existing) {
      return NextResponse.json({ ok: true, already: true, product, amount: existing.amount });
    }

    // Verify the PayPal order really is for this proposal and this exact amount.
    const order = await getOrder(orderId);
    const unit = order.purchase_units?.[0];
    if (unit?.custom_id !== entry.id) {
      return NextResponse.json({ ok: false, error: "Order does not match proposal" }, { status: 400 });
    }
    if (Number(unit?.amount?.value) !== Number(product.price.toFixed(2))) {
      return NextResponse.json({ ok: false, error: "Order amount does not match" }, { status: 400 });
    }

    const policy = checkPurchase(product, spentThisMonth());
    if (!policy.allowed) {
      return NextResponse.json({ ok: false, error: policy.reasons.join(" ") }, { status: 403 });
    }

    const captured = await captureOrder(orderId);
    const capture = captured.purchase_units?.[0]?.payments?.captures?.[0];
    if (captured.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
      return NextResponse.json(
        { ok: false, error: `Payment not completed (status: ${capture?.status ?? captured.status})` },
        { status: 402 }
      );
    }

    const amount = Number(capture.amount.value);
    addEntry({
      type: "purchase",
      summary: `Purchased ${product.title} for $${amount.toFixed(2)}`,
      amount,
      detail: { proposalId: entry.id, orderId, captureId: capture.id, product },
    });
    return NextResponse.json({ ok: true, product, amount, captureId: capture.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}