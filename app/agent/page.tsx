"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  title: string;
  brand: string | null;
  retailer: string;
  price: number;
  currency: string;
  listPrice: number | null;
  imageUrl: string | null;
  buyUrl: string;
};
type Proposal = {
  product: Product;
  reason: string;
  policy: { allowed: boolean; needsApproval: boolean; reasons: string[] };
};
type LogLine = { step: number; tool: string; args: unknown; result: unknown };
type Budget = {
  spent: number;
  policy: {
    perPurchaseCap: number;
    monthlyBudget: number;
    requireApprovalAbove: number;
    blockedKeywords: string[];
  };
};

const EXAMPLES = [
  "A waterproof hiking jacket under $100",
  "A 27-inch 4K monitor",
  "A $500 laptop for the team",
];

const money = (n: number) => `$${n.toFixed(2)}`;

function friendly(message: string) {
  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
    return "Gemini’s free quota is used up for now. Wait a minute and try again. If it keeps happening, today’s limit is spent.";
  }
  return message.replace(/^Error:\s*/, "").slice(0, 300);
}

function blockedReasons(log: LogLine[]): string[] {
  const out: string[] = [];
  for (const l of log) {
    const r = l.result as any;
    if (Array.isArray(r?.reasons) && (r.accepted === false || r.allowed === false)) {
      out.push(...r.reasons);
    }
  }
  return [...new Set(out)];
}

function describe(l: LogLine): string {
  const args = (l.args ?? {}) as Record<string, unknown>;
  const result = (l.result ?? {}) as Record<string, any>;
  if (l.tool === "search_products") {
    const n = Array.isArray(result.products) ? result.products.length : 0;
    return `Searched for “${String(args.query ?? "")}” and found ${n} option${n === 1 ? "" : "s"}`;
  }
  if (result.error) return "Looked up an option that wasn’t in the search results";
  if (l.tool === "check_policy") {
    return result.allowed ? "Checked an option: within policy" : "Checked an option: refused by policy";
  }
  if (l.tool === "propose_purchase") {
    return result.accepted ? "Proposed a purchase for your approval" : "Proposal refused by policy";
  }
  return l.tool;
}

function checksFor(p: Proposal, b: Budget | null) {
  if (!b) return p.policy.reasons.map((text) => ({ tone: "ok" as const, text }));
  const price = p.product.price;
  const { perPurchaseCap, monthlyBudget, requireApprovalAbove } = b.policy;
  const rows: { tone: "ok" | "warn"; text: string }[] = [
    { tone: "ok", text: `Under the ${money(perPurchaseCap)} limit for one purchase` },
    {
      tone: "ok",
      text: `Fits this month’s budget: ${money(b.spent + price)} of ${money(monthlyBudget)} after buying`,
    },
    { tone: "ok", text: "In stock and not in a blocked category" },
  ];
  rows.push(
    price > requireApprovalAbove
      ? { tone: "warn", text: `Over ${money(requireApprovalAbove)}, so it’s flagged for your attention` }
      : { tone: "ok", text: `Under ${money(requireApprovalAbove)}, and you still confirm every purchase` }
  );
  return rows;
}

export default function AgentPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [proposalId, setProposalId] = useState("");
  const [log, setLog] = useState<LogLine[]>([]);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<"" | "approving" | "rejected">("");
  const [budget, setBudget] = useState<Budget | null>(null);

  async function loadBudget() {
    try {
      const res = await fetch("/api/budget", { cache: "no-store" });
      setBudget(await res.json());
    } catch {
      /* the page still works without the sidebar numbers */
    }
  }

  useEffect(() => {
    loadBudget();
  }, []);

  async function ask() {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError("");
    setReply("");
    setProposal(null);
    setProposalId("");
    setLog([]);
    setDecision("");
    loadBudget();
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Something went wrong");
      setReply(data.reply);
      setProposal(data.proposal);
      setProposalId(data.proposalId ?? "");
      setLog(data.log ?? []);
    } catch (e) {
      setError(friendly(String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!proposalId) return;
    setDecision("approving");
    setError("");
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Could not start checkout");
      window.location.href = data.approveUrl; // on to PayPal
    } catch (e) {
      setError(friendly(String(e)));
      setDecision("");
    }
  }

  const reasons = !proposal && reply ? blockedReasons(log) : [];
  const pct = budget
    ? Math.min(100, Math.round((budget.spent / budget.policy.monthlyBudget) * 100))
    : 0;

  return (
    <div className="st-agent">
      <section>
        <h1 className="sm">What does your team need?</h1>
        <p className="lead">
          The agent searches, checks each option against your spending rules, and brings you one proposal.
          Nothing is bought until you approve it.
        </p>

        <div className="st-ask">
          <input
            aria-label="What do you need?"
            placeholder="For example: a waterproof hiking jacket under $100"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
          />
          <button className="st-btn" onClick={ask} disabled={loading}>
            {loading ? "Working" : "Ask the agent"}
          </button>
        </div>

        <div className="st-chips">
          {EXAMPLES.map((example) => (
            <button key={example} className="st-chip" onClick={() => setMessage(example)}>
              {example}
            </button>
          ))}
        </div>

        {loading && (
          <p className="st-working" role="status">
            <span className="st-pulse" />
            Searching and checking policy. This can take up to a minute.
          </p>
        )}
        {error && (
          <p className="st-error" role="alert">
            {error}
          </p>
        )}

        {reply && (
          <div className="st-reply">
            <p className="st-label">The agent says</p>
            <p>{reply}</p>
          </div>
        )}

        {proposal && (
          <article className="st-slip" aria-label="Proposed purchase">
            <div className="st-slip-body">
              {proposal.product.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proposal.product.imageUrl} alt="" />
              )}
              <div>
                <p className="st-label">Proposed purchase</p>
                <h2 className="st-slip-title">{proposal.product.title}</h2>
                <p className="st-muted">
                  {proposal.product.brand
                    ? `${proposal.product.brand} at ${proposal.product.retailer}`
                    : proposal.product.retailer}
                </p>
                <p className="st-money st-slip-price">
                  {money(proposal.product.price)}
                  {proposal.product.listPrice && (
                    <span className="st-was">{money(proposal.product.listPrice)}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="st-pad">
              <p className="st-label">Why this one</p>
              <p>{proposal.reason}</p>
            </div>
            <ul className="st-checks">
              {checksFor(proposal, budget).map((c, i) => (
                <li key={i} className={c.tone === "warn" ? "warn" : ""}>
                  {c.text}
                </li>
              ))}
            </ul>
            <div className="st-cut" />
            <div className="st-slip-foot">
              {decision === "" && (
                <>
                  <button className="st-btn" onClick={approve} disabled={!proposalId}>
                    Approve and pay with PayPal
                  </button>
                  <button className="st-btn ghost" onClick={() => setDecision("rejected")}>
                    Reject
                  </button>
                </>
              )}
              {decision === "approving" && <p role="status">Opening PayPal…</p>}
              {decision === "rejected" && <p>Rejected. Nothing was bought.</p>}
            </div>
          </article>
        )}

        {!proposal && reply && (
          <div className="st-blocked">
            <p className="st-tag bad">Nothing was bought</p>
            {reasons.length > 0 ? (
              <ul>
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="st-muted" style={{ marginTop: 8 }}>
                No option fit your spending rules.
              </p>
            )}
          </div>
        )}

        {log.length > 0 && (
          <details>
            <summary>What the agent did ({log.length} steps)</summary>
            <ol className="st-steps">
              {log.map((l) => (
                <li key={l.step}>{describe(l)}</li>
              ))}
            </ol>
          </details>
        )}
      </section>

      <aside className="st-aside" aria-label="Spending rules">
        <h2>Spending rules</h2>
        {budget ? (
          <>
            <p className="st-label">Left this month</p>
            <p className="st-money st-big">
              {money(Math.max(0, budget.policy.monthlyBudget - budget.spent))}
            </p>
            <div
              className="st-meter"
              role="img"
              aria-label={`${pct} percent of the monthly budget used`}
            >
              <i style={{ width: `${pct}%` }} />
            </div>
            <p className="st-muted st-small">
              {money(budget.spent)} spent of {money(budget.policy.monthlyBudget)}
            </p>
            <ul className="st-aside-list">
              <li>Up to {money(budget.policy.perPurchaseCap)} for one purchase</li>
              <li>You approve each purchase before PayPal charges anything</li>
              <li>Never: {budget.policy.blockedKeywords.join(", ")}</li>
            </ul>
          </>
        ) : (
          <p className="st-muted">Loading your budget…</p>
        )}
        <Link href="/history">Open the audit trail</Link>
      </aside>
    </div>
  );
}