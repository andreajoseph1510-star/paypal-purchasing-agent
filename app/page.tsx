import Link from "next/link";
import Shell from "./components/shell";
import ScaleArt from "./components/ScaleArt";
import { DEFAULT_POLICY } from "@/lib/policy";

const SAMPLE = [
  {
    ask: "A waterproof hiking jacket under $100",
    item: "Oakhowe Isotex Waterproof Hiking Jacket",
    price: "$39.99",
    tone: "ok",
    status: "Approved and paid with PayPal",
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
        <div className="st-hero-text">
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
          <p className="st-muted st-small" style={{ marginTop: 20 }}>
            Runs on the PayPal sandbox. No real money moves.
          </p>
        </div>
        <div className="st-hero-art">
          <ScaleArt />
        </div>
      </section>

      <section className="st-section">
        <h2>Two requests, two outcomes</h2>
        <div className="st-scroll">
          <table className="st-table">
            <thead>
              <tr>
                <th>You asked for</th>
                <th>Best match found</th>
                <th className="num">Price</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map((row) => (
                <tr key={row.ask}>
                  <td>{row.ask}</td>
                  <td>{row.item}</td>
                  <td className="num st-money">{row.price}</td>
                  <td>
                    <span className={`st-tag ${row.tone}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          payment.
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