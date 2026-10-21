# Steward: an AI purchasing agent with spending guardrails

Steward lets a small team describe what they need ("a waterproof hiking jacket under $100"). An AI agent searches real products, checks every candidate against the team's spending policy, and proposes one purchase. A human approves it, and PayPal takes the payment. The rules are enforced in code, so the AI cannot talk its way past them.

Built for the PayPal AI Hackathon.

**Live demo:**//paypal-purchasing-agent.onrender.com
**Demo video:** _add your YouTube link here_

## The problem

Small teams and clubs lose time on purchasing: someone finds an item, someone else approves it, someone pays. Handing this to an AI agent is tempting, but an agent with a payment method and no hard limits is risky. Steward shows a safer pattern: the AI does the searching and reasoning, while code enforces the policy and a human gives the final yes.

## What it does

1. **Ask:** type a request on the `/agent` page.
2. **Search and decide:** a Gemini agent searches products through Channel3, then proposes the best-value in-stock option.
3. **Policy check:** every proposal is checked against the policy (per-purchase cap, monthly budget, blocked categories). Blocked items are refused with a plain-language reason.
4. **Human approval:** the proposal appears as a card with the product, price, reasoning and policy result. Nothing is charged until a person clicks Approve.
5. **Pay with PayPal:** approval creates a PayPal order, the buyer approves it in the PayPal sandbox, and the server verifies and captures the payment.
6. **Audit trail:** the `/history` page shows the monthly budget, completed purchases, and every step the agent took.

Default policy (see `lib/policy.ts`): $120 per purchase, $500 per month, human approval above $60, and blocked keywords such as gift cards and gambling.

## How PayPal is used

- **Orders API v2:** `POST /v2/checkout/orders` creates the order (`intent: CAPTURE`) and `POST /v2/checkout/orders/{id}/capture` captures it after buyer approval.
- **Server-side verification:** before capturing, the server fetches the order from PayPal and confirms that it belongs to our recorded proposal (`custom_id`) and that the amount matches exactly. The price always comes from the server's own record, never from the browser.
- **Idempotency:** `PayPal-Request-Id` headers prevent duplicate orders and captures, and the capture route is safe to call twice.
- **Policy re-check:** the policy is checked again at order creation and again before capture.
- **Existing boilerplate:** the `/dashboard` page and read-only PayPal data pages come from the PayPal x AG Grid boilerplate (Reporting, Catalog, Subscriptions and Invoicing endpoints). We made the dashboard tolerate endpoints the sandbox app is not permitted to read.

## How AI is used

- **Gemini (`@google/genai`) with function calling** runs the agent in `lib/agent.ts`. It has three tools: `search_products`, `check_policy` and `propose_purchase`.
- The model decides what to search for, which candidate is best value, and how to explain the choice. It loops over tool calls until it can answer.
- **The guardrail is code, not a prompt.** `propose_purchase` re-runs the policy check and refuses the proposal if it fails, whatever the model says. Product prices come from our own search results, so the model cannot invent a price.
- **Channel3** supplies live product data (titles, prices, retailers, images). If it fails or returns nothing, a small fallback catalog keeps the demo working.

## Architecture

```
Browser (/agent)
   |  POST /api/agent
   v
Gemini agent (lib/agent.ts) --tools--> Channel3 search (lib/channel3.ts)
   |                           \-----> Policy check   (lib/policy.ts)
   v
Proposal saved by the server (lib/ledger.ts -> data/ledger.json)
   |  Approve button -> POST /api/checkout/create
   v
PayPal Orders API: create order -> buyer approves in sandbox
   |  return page -> POST /api/checkout/capture
   v
Server verifies order + amount + policy -> captures -> records purchase
   |
   v
/history: budget, purchases, full audit trail
```

## Run it yourself

Requirements: Node.js 20.9 or newer.

```bash
git clone <this repo's URL>
cd <repo folder>
npm install
cp env.example .env.local      # on Windows PowerShell: copy env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
| --- | --- |
| `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` | developer.paypal.com, Apps & Credentials, **Sandbox**. Enable the **Transaction search** feature on the app. |
| `CHANNEL3_API_KEY` | trychannel3.com/developers |
| `GEMINI_API_KEY` | aistudio.google.com |
| `GEMINI_MODEL` | for example `gemini-3.5-flash` |
| `APP_URL` | `http://localhost:3000` locally, or your deployed URL |

Then:

```bash
npm run dev
```



### Sandbox buyer account

Use this PayPal sandbox **Personal** account on the PayPal approval page (fake money):

- Email: sb-fi6t453393655@personal.example.com
- Password: ={Ax)v0>

### Try it

1. Click an example prompt such as "a waterproof hiking jacket under $100" and press **Ask agent**.
2. Review the proposal card, then click **Approve and pay with PayPal**.
3. Log in with the sandbox buyer and approve. You return to a "Purchase complete" page.
4. Open `/history` to see the budget bar and the audit trail.
5. Ask for something over the cap, such as a $500 laptop, and watch the policy refuse it.

Developer shortcut (development only): `/api/dev/test-checkout` skips the AI and sends a policy-approved product straight to PayPal, which is handy for testing payments without using Gemini quota.

## Honest limits

- This is a **prototype running against the PayPal sandbox**. No real money moves.
- Channel3 buy links point to the retailers' own sites, and PayPal cannot pay those retailers directly. In this prototype the PayPal payment goes to the merchant account as a purchase order the app records, and the retailer link is kept as the fulfilment reference.
- Payment confirmation is verified and captured on the server when the buyer returns. We did not add PayPal webhooks, which would be the next step for production.
- Purchases and the audit trail are stored in a local file (`data/ledger.json`). A hosted free tier may reset it when it restarts.
- The Gemini free tier has low rate limits, so the agent retries when it is rate limited and a run can take up to a minute.
- The dashboard's invoice widgets stay empty if the sandbox app is not permitted to read invoices.

## Built during the hackathon

Everything under `lib/agent.ts`, `lib/policy.ts`, `lib/ledger.ts`, `lib/channel3.ts`, `lib/paypal-orders.ts`, `app/agent`, `app/history` and `app/api/{agent,checkout}`, plus the dashboard changes described above. The base project is the PayPal x AG Grid hackathon boilerplate.

## Tools

Gemini (agent reasoning and tool calling), Channel3 (product search), PayPal Orders and Reporting APIs, Next.js, TypeScript, AG Studio (from the boilerplate dashboard).

## License

MIT, see [LICENSE](LICENSE).
