"use client";

import { useState } from "react";

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

const EXAMPLES = [
  "a waterproof hiking jacket under $100",
  "a 27 inch 4K monitor",
  "a $500 laptop for the team",
];

export default function AgentPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [proposalId, setProposalId] = useState("");
  const [log, setLog] = useState<LogLine[]>([]);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<"" | "approving" | "rejected">("");

  async function ask() {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError("");
    setReply("");
    setProposal(null);
    setProposalId("");
    setLog([]);
    setDecision("");
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
      setError(String(e));
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
      window.location.href = data.approveUrl; // go to PayPal
    } catch (e) {
      setError(String(e));
      setDecision("");
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold text-[#001c64]">Purchasing agent</h1>
      <a href="/history" className="text-sm font-semibold text-[#0070e0]">View spending and audit trail →</a>
      <p className="mt-1 text-gray-600">
        Describe what your team needs. The agent searches, checks the spending
        policy, and proposes one purchase for your approval.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3"
          placeholder="e.g. a waterproof hiking jacket under $100"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button
          onClick={ask}
          disabled={loading}
          className="rounded-lg bg-[#0070e0] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Working..." : "Ask agent"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            onClick={() => setMessage(example)}
            className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            {example}
          </button>
        ))}
      </div>

      {loading && (
        <p className="mt-4 text-gray-500">
          The agent is searching and checking policy. This can take up to a minute.
        </p>
      )}
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

      {reply && (
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-semibold uppercase text-gray-500">Agent</p>
          <p className="mt-1">{reply}</p>
        </div>
      )}

      {proposal && (
        <div className="mt-6 rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm font-semibold uppercase text-gray-500">Proposed purchase</p>
          <div className="mt-3 flex gap-4">
            {proposal.product.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proposal.product.imageUrl}
                alt=""
                className="h-28 w-28 rounded object-cover"
              />
            )}
            <div>
              <p className="text-lg font-semibold">{proposal.product.title}</p>
              <p className="text-gray-600">
                {proposal.product.brand} · {proposal.product.retailer}
              </p>
              <p className="mt-1 text-2xl font-bold">
                ${proposal.product.price.toFixed(2)}{" "}
                {proposal.product.listPrice && (
                  <span className="text-base font-normal text-gray-400 line-through">
                    ${proposal.product.listPrice.toFixed(2)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-700">Why: {proposal.reason}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
            {proposal.policy.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>

          {decision === "" ? (
            <div className="mt-4 flex gap-2">
              <button
                onClick={approve}
                disabled={!proposalId}
                className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                Approve and pay with PayPal
              </button>
              <button
                onClick={() => setDecision("rejected")}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold"
              >
                Reject
              </button>
            </div>
          ) : (
            <p className="mt-4 font-semibold">
              {decision === "approving"
                ? "Opening PayPal..."
                : "Rejected. Nothing was purchased."}
            </p>
          )}
        </div>
      )}

      {log.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer font-semibold">
            Agent decision log ({log.length} steps)
          </summary>
          <ol className="mt-2 space-y-2 text-sm">
            {log.map((l) => (
              <li key={l.step} className="rounded bg-gray-50 p-2">
                <span className="font-mono font-semibold">
                  {l.step}. {l.tool}
                </span>
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs text-gray-600">
                  {JSON.stringify(l.args)}
                </pre>
              </li>
            ))}
          </ol>
        </details>
      )}
    </main>
  );
}