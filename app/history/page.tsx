import { listEntries, spentThisMonth } from "@/lib/ledger";
import { DEFAULT_POLICY } from "@/lib/policy";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const entries = listEntries().slice().reverse();
  const purchases = entries.filter((e) => e.type === "purchase");
  const spent = spentThisMonth();
  const budget = DEFAULT_POLICY.monthlyBudget;
  const pct = Math.min(100, Math.round((spent / budget) * 100));

  return (
    <main className="mx-auto max-w-3xl p-6">
      <a href="/agent" className="font-semibold text-[#0070e0]">
        ← Back to the agent
      </a>
      <h1 className="mt-3 text-3xl font-bold text-[#001c64]">Spending and audit trail</h1>

      <section className="mt-6 rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-semibold uppercase text-gray-500">This month</p>
        <p className="mt-1 text-2xl font-bold">
          ${spent.toFixed(2)} <span className="text-base font-normal text-gray-500">of ${budget.toFixed(2)}</span>
        </p>
        <div className="mt-2 h-3 w-full rounded bg-gray-100">
          <div className="h-3 rounded bg-[#0070e0]" style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-3 list-disc pl-5 text-sm text-gray-600">
          <li>Per-purchase cap: ${DEFAULT_POLICY.perPurchaseCap}</li>
          <li>Human approval required above: ${DEFAULT_POLICY.requireApprovalAbove}</li>
          <li>Blocked categories: {DEFAULT_POLICY.blockedKeywords.join(", ")}</li>
        </ul>
      </section>

      <h2 className="mt-8 text-xl font-bold">Purchases ({purchases.length})</h2>
      {purchases.length === 0 && <p className="mt-2 text-gray-500">No purchases yet.</p>}
      <ul className="mt-2 space-y-2">
        {purchases.map((e) => (
          <li key={e.id} className="rounded-lg bg-green-50 p-3">
            <p className="font-semibold">{e.summary}</p>
            <p className="text-sm text-gray-500">{new Date(e.time).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-bold">Everything the agent did</h2>
      <ol className="mt-2 space-y-1 text-sm">
        {entries.map((e) => (
          <li key={e.id} className="rounded bg-gray-50 p-2">
            <span className="font-mono text-xs text-gray-500">
              {new Date(e.time).toLocaleTimeString("en-GB", { timeZone: "UTC" })} UTC · {e.type}
            </span>
            <p>{e.summary}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}