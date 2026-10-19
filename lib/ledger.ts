import fs from "node:fs";
import path from "node:path";

export type LedgerEntry = {
  id: string;
  time: string;
  type: "decision" | "purchase"| "proposal";
  summary: string;
  amount?: number; // only for type "purchase"
  detail?: unknown;
};   

const FILE = path.join(process.cwd(), "data", "ledger.json");

function read(): LedgerEntry[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function write(entries: LedgerEntry[]) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(entries, null, 2));
}

export function addEntry(entry: Omit<LedgerEntry, "id" | "time">): LedgerEntry {
  const full: LedgerEntry = {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    ...entry,
  };
  write([...read(), full]);
  return full;
}

export function listEntries(): LedgerEntry[] {
  return read();
}

// Total of purchases made in the current calendar month.
export function spentThisMonth(now = new Date()): number {
  const ym = now.toISOString().slice(0, 7); // e.g. "2026-10"
  return read()
    .filter((e) => e.type === "purchase" && e.time.startsWith(ym))
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);
}
export function getEntry(id: string): LedgerEntry | undefined {
     return read().find((e) => e.id === id);
}