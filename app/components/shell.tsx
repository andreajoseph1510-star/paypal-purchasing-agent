import Link from "next/link";
import type { ReactNode } from "react";
import { display, mono } from "../font";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={`st ${display.variable} ${mono.variable}`}>
      <div className="st-wrap">
        <header className="st-nav">
          <Link href="/" className="st-brand">
            Steward
          </Link>
          <nav className="st-links" aria-label="Main">
            <Link href="/agent">Agent</Link>
            <Link href="/history">History</Link>
            <Link href="/dashboard">PayPal data</Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}