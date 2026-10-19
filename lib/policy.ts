import type { Product } from "./channel3";

export type Policy = {
  perPurchaseCap: number; // max price of a single purchase
  monthlyBudget: number; // max total spend per calendar month
  requireApprovalAbove: number; // above this, a human must approve
  blockedKeywords: string[]; // words that are never allowed
};

export const DEFAULT_POLICY: Policy = {
  perPurchaseCap: 120,
  monthlyBudget: 500,
  requireApprovalAbove: 60,
  blockedKeywords: ["gift card", "gambling", "casino", "crypto"],
};

export type PolicyResult = {
  allowed: boolean;
  needsApproval: boolean;
  reasons: string[]; // human-readable explanation for every rule that applied
};

// Pure function: same inputs always give the same answer. The agent cannot override it.
export function checkPurchase(
  product: Pick<Product, "title" | "description" | "price" | "currency" | "inStock">,
  spentThisMonth: number,
  policy: Policy = DEFAULT_POLICY
): PolicyResult {
  const reasons: string[] = [];
  let allowed = true;

  if (!product.inStock) {
    allowed = false;
    reasons.push("Blocked: the item is not in stock.");
  }

  if (product.currency !== "USD") {
    allowed = false;
    reasons.push(`Blocked: currency ${product.currency} is not supported (USD only).`);
  }

  if (product.price > policy.perPurchaseCap) {
    allowed = false;
    reasons.push(
      `Blocked: $${product.price.toFixed(2)} is over the per-purchase cap of $${policy.perPurchaseCap.toFixed(2)}.`
    );
  }

  const projected = spentThisMonth + product.price;
  if (projected > policy.monthlyBudget) {
    allowed = false;
    reasons.push(
      `Blocked: this would bring the month's spend to $${projected.toFixed(2)}, over the monthly budget of $${policy.monthlyBudget.toFixed(2)}.`
    );
  }

  const text = `${product.title} ${product.description ?? ""}`.toLowerCase();
  const hit = policy.blockedKeywords.find((k) => text.includes(k.toLowerCase()));
  if (hit) {
    allowed = false;
    reasons.push(`Blocked: the item matches the restricted category "${hit}".`);
  }

  const needsApproval = allowed && product.price > policy.requireApprovalAbove;
  if (allowed && needsApproval) {
    reasons.push(
      `Needs approval: $${product.price.toFixed(2)} is above the auto-approve limit of $${policy.requireApprovalAbove.toFixed(2)}.`
    );
  }
  if (allowed && !needsApproval) {
    reasons.push("Within policy: no approval needed.");
  }

  return { allowed, needsApproval, reasons };
}