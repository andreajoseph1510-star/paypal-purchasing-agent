import Link from "next/link";
import Shell from "./components/shell";
import { DEFAULT_POLICY } from "@/lib/policy";

const SAMPLE = [
  {
    ask: "A waterproof hiking jacket under $100",
    item: "Oakhowe Isotex Waterproof Hiking Jacket",
    price: "$39.99",
    tone: "ok",
    status: "You approved it and PayPal took the payment",
  },
  {
    ask: "A 27-inch 4K monitor",
    item: "ViewSonic VP2766-4K 27 Inch 4K UHD",
    price: "$373.99",
    tone: "bad",
    status: "Refused: over the $120 limit",
  },
];

const DATA_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Catalog products" },
  { href: "/plans", label: "Billing plans" },
  { href: "/invoices", label: "Invoices" },
  { href: "/transactions", label: "Transactions" },
  { href: "/balances", label: "Balances" },
];

export default function Home() {
  const p = DEFAULT_POLICY;
  return (
    <Shell>
      <section className="st-hero">
        <div>
          <h1>An AI buyer with a hard spending limit.</h1>
          <p className="lead">
            Tell Steward what your team needs. It finds the item, checks it against your budget rules, and
            waits for your approval before PayPal takes a cent.
          </p>
          <div className="st-actions">
            <Link href="/agent" className="st-btn">
              Open the agent
            </Link>
            <Link href="/history" className="st-btn ghost">
              See the audit trail
            </Link>
          </div>
        </div>

        <div className="st-sample" aria-label="Example requests">
          {SAMPLE.map((row) => (
            <div key={row.ask} className="st-sample-row">
              <p className="st-label">You asked for: {row.ask}</p>
              <p className="st-sample-item">{row.item}</p>
              <div className="st-sample-foot">
                <span className={`st-tag ${row.tone}`}>{row.status}</span>
                <span className="st-money">{row.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="st-section">
        <h2>Rules the AI can’t argue with</h2>
        <p className="st-muted" style={{ maxWidth: "58ch" }}>
          The model chooses what to search for and which option looks best. The limits below live in code,
          and they’re checked again when you approve and once more before PayPal captures the payment.
        </p>
        <ul className="st-rule-list">
          <li>
            Nothing over <b>${p.perPurchaseCap}</b> in a single purchase.
          </li>
          <li>
            No more than <b>${p.monthlyBudget}</b> a month in total.
          </li>
          <li>
            Anything over <b>${p.requireApprovalAbove}</b> is flagged, and every purchase waits for your yes.
          </li>
          <li>Gift cards, gambling, casino and crypto are always refused.</li>
        </ul>
      </section>

      <section className="st-section">
        <h2>Under the hood</h2>
        <p className="st-muted" style={{ maxWidth: "58ch" }}>
          Gemini runs the agent, Channel3 supplies live product listings, and PayPal Orders handles the
          payment. Everything runs against the PayPal sandbox, so no real money moves.
        </p>
        <p className="st-label" style={{ marginTop: 28 }}>
          PayPal sandbox data
        </p>
        <div className="st-links-row">
          {DATA_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}