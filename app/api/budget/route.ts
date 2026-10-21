import { NextResponse } from "next/server";
import { DEFAULT_POLICY } from "@/lib/policy";
import { spentThisMonth } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ policy: DEFAULT_POLICY, spent: spentThisMonth() });
}