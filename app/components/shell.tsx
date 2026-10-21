import Link from "next/link";
import type { ReactNode } from "react";
import { serif, sans, mono } from "../font";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={`st ${serif.variable} ${sans.variable} ${mono.variable}`}>
      <header className="st-bar">
        <div className="st-bar-in">
          <Link href="/" className="st-brand">
            <span className="st-mark" aria-hidden="true">
              S
            </span>
            Steward
          </Link>
          <nav className="st-links" aria-label="Main">
            <Link href="/agent">Agent</Link>
            <Link href="/history">History</Link>
            <Link href="/dashboard">PayPal data</Link>
          </nav>
          <Link href="/agent" className="st-btn ghost">
            Get started
          </Link>
        </div>
      </header>
      <div className="st-main">{children}</div>
    </div>
  );
}