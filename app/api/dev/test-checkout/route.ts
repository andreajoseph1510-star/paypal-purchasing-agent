import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/channel3";
import { checkPurchase } from "@/lib/policy";
import { addEntry, spentThisMonth } from "@/lib/ledger";
import { createOrder } from "@/lib/paypal-orders";

// Developer shortcut: skips the AI and sends a real policy-approved product to PayPal.
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not available" }, { status: 404 });
  }
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "waterproof hiking jacket";
    const spent = spentThisMonth();
    const products = await searchProducts(q, { maxPrice: 120, limit: 6 });
    const product = products.find((p) => checkPurchase(p, spent).allowed);
    if (!product) {
      return NextResponse.json({ ok: false, error: "No product fits the policy" }, { status: 404 });
    }
    const entry = addEntry({
      type: "proposal",
      summary: `Test proposal: ${product.title} at $${product.price.toFixed(2)}`,
      detail: { product, reason: "Developer test (no AI)", policy: checkPurchase(product, spent) },
    });
    const base = process.env.APP_URL ?? new URL(request.url).origin;
    const order = await createOrder({
      proposalId: entry.id,
      title: product.title,
      amount: product.price,
      returnUrl: `${base}/agent/return?proposalId=${entry.id}`,
      cancelUrl: `${base}/agent`,
    });
    return NextResponse.redirect(order.approveUrl);
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}