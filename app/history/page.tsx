import Shell from "../components/shell";
import { listEntries, spentThisMonth } from "@/lib/ledger";
import { DEFAULT_POLICY } from "@/lib/policy";

export const dynamic = "force-dynamic";

const money = (n: number) => `$${n.toFixed(2)}`;
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " UTC";

const TYPE: Record<string, { label: string; tone: string }> = {
  purchase: { label: "Purchase", tone: "ok" },
  proposal: { label: "Proposal", tone: "info" },
  decision: { label: "Decision", tone: "quiet" },
};

export default function HistoryPage() {
  const entries = listEntries().slice().reverse();
  const purchases = entries.filter((e) => e.type === "purchase");
  const trail = entries.slice(0, 40);
  const spent = spentThisMonth();
  const budget = DEFAULT_POLICY.monthlyBudget;
  const pct = Math.min(100, Math.round((spent / budget) * 100));

  return (
    <Shell>
      <h1 className="sm">Spending and audit trail</h1>
      <p className="lead">Every purchase and every step the agent took, with times in UTC.</p>

      <div className="st-sum" style={{ marginTop: 32 }}>
        <p className="st-label">Spent this month</p>
        <p className="st-money st-big">{money(spent)}</p>
        <div className="st-meter" role="img" aria-label={`${pct} percent of the monthly budget used`}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <p className="st-muted st-small">
          of {money(budget)}. Limit per purchase {money(DEFAULT_POLICY.perPurchaseCap)}.
        </p>
      </div>

      <section className="st-section">
        <h2>Purchases</h2>
        {purchases.length === 0 ? (
          <p className="st-muted">Nothing has been bought yet. Ask the agent for something to get started.</p>
        ) : (
          <table className="st-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Item</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((e) => {
                const product = (e.detail as { product?: { title?: string; retailer?: string } } | undefined)
                  ?.product;
                return (
                  <tr key={e.id}>
                    <td>{when(e.time)}</td>
                    <td>
                      {product?.title ?? e.summary}
                      {product?.retailer && <div className="st-muted st-small">{product.retailer}</div>}
                    </td>
                    <td className="num st-money">{money(e.amount ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="st-section">
        <h2>Audit trail</h2>
        <ul className="st-trail">
          {trail.map((e) => {
            const t = TYPE[e.type] ?? { label: e.type, tone: "quiet" };
            return (
              <li key={e.id}>
                <span className="st-muted">{when(e.time)}</span>
                <span className={`st-tag ${t.tone}`}>{t.label}</span>
                <span>{e.summary}</span>
              </li>
            );
          })}
        </ul>
        {entries.length > trail.length && (
          <p className="st-muted st-small" style={{ marginTop: 12 }}>
            Showing the latest {trail.length} of {entries.length} entries.
          </p>
        )}
      </section>
    </Shell>
  );
}