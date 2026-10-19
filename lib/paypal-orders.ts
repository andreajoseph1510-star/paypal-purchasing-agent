const BASE_URL = "https://api-m.sandbox.paypal.com";

async function token(): Promise<string> {
  const { PAYPAL_CLIENT_ID: id, PAYPAL_SECRET: secret } = process.env;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set");
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function paypal<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
  requestId?: string
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token()}`,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PayPal ${res.status} on ${path}: ${text.slice(0, 400)}`);
  return JSON.parse(text) as T;
}

export async function createOrder(input: {
  proposalId: string;
  title: string;
  amount: number;
  returnUrl: string;
  cancelUrl: string;
}) {
  const order = await paypal<any>(
    "/v2/checkout/orders",
    "POST",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: input.proposalId, // ties the PayPal order to our proposal
          description: input.title.slice(0, 120),
          amount: { currency_code: "USD", value: input.amount.toFixed(2) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
          },
        },
      },
    },
    `order-${input.proposalId}` // idempotency: retrying never creates a second order
  );
  const link = (order.links ?? []).find(
    (l: any) => l.rel === "payer-action" || l.rel === "approve"
  );
  if (!link) throw new Error("PayPal did not return an approval link");
  return { orderId: order.id as string, approveUrl: link.href as string };
}

export function getOrder(orderId: string) {
  return paypal<any>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, "GET");
}

export function captureOrder(orderId: string) {
  return paypal<any>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    "POST",
    {},
    `capture-${orderId}`
  );
}