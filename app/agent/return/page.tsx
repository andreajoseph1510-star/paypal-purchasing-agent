"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

function Result() {
  const params = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [text, setText] = useState("Confirming your payment with PayPal...");

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
        setText(String(e));
      });
  }, [params]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-bold text-[#001c64]">
        {state === "done" ? "Purchase complete" : state === "error" ? "Payment problem" : "One moment"}
      </h1>
      <p className="mt-3 text-lg">{text}</p>
      <a href="/agent" className="mt-6 inline-block font-semibold text-[#0070e0]">
        Back to the agent
      </a>
    </main>
  );
}

export default function ReturnPage() {
  return (
    <Suspense fallback={null}>
      <Result />
    </Suspense>
  );
}