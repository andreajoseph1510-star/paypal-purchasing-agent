import { NextResponse } from "next/server";
import { checkPurchase } from "@/lib/policy";
import { spentThisMonth } from "@/lib/ledger";

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const product = {
    title: p.get("title") ?? "Test item",
    description: null,
    price: Number(p.get("price") ?? 50),
    currency: "USD",
    inStock: true,
  };
  const spent = p.get("spent") ? Number(p.get("spent")) : spentThisMonth();
  return NextResponse.json({ product, spent, result: checkPurchase(product, spent) });
}