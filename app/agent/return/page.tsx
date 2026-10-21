"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function Result() {
  const params = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [text, setText] = useState("Confirming your payment with PayPal.");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const orderId = params.get("token"); // PayPal puts the order id in "token"
    const proposalId = params.get("proposalId");
    fetch("/api/checkout/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, proposalId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) throw new Error(data.error ?? "Payment failed");
        setState("done");
        setText(`Paid $${Number(data.amount).toFixed(2)} for ${data.product.title}.`);
      })
      .catch((e) => {
        setState("error");
        setText(String(e).replace(/^Error:\s*/, "").slice(0, 300));
      });
  }, [params]);

  return (
    <section>
      <h1 className="sm">
        {state === "done" ? "Purchase complete" : state === "error" ? "The payment didn’t go through" : "One moment"}
      </h1>
      <p className="lead" role="status">
        {text}
      </p>
      <div className="st-actions">
        <Link href="/agent" className="st-btn">
          Back to the agent
        </Link>
        <Link href="/history" className="st-btn ghost">
          See the audit trail
        </Link>
      </div>
    </section>
  );
}

export default function ReturnPage() {
  return (
    <Suspense fallback={null}>
      <Result />
    </Suspense>
  );
}