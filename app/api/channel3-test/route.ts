import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/channel3";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? "waterproof hiking jacket";
  const max = params.get("max");
  const products = await searchProducts(query, {
    maxPrice: max ? Number(max) : undefined,
  });
  return NextResponse.json({ ok: true, count: products.length, products });
}