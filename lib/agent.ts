import { GoogleGenAI, Type } from "@google/genai";
import { searchProducts, type Product } from "./channel3";
import { checkPurchase, type PolicyResult } from "./policy";
import { addEntry, spentThisMonth } from "./ledger";

export type Proposal = {
  product: Product;
  reason: string;
  policy: PolicyResult;
};

export type LogLine = { step: number; tool: string; args: unknown; result: unknown };

const SYSTEM_PROMPT = `You are a purchasing agent for a small team.
Find the best-value, in-stock product that fits the request.
Always: 1) search_products, 2) check_policy on your best candidate, 3) propose_purchase if it is allowed.
If the policy blocks a product, try a cheaper alternative or explain clearly why nothing fits.
Finish with a short reply (two sentences) explaining your choice or why you could not buy.`;

const TOOLS: any[] = [
  {
    functionDeclarations: [
      {
        name: "search_products",
        description: "Search for products to buy. Returns a short list with ids and prices.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "What to search for" },
            maxPrice: { type: Type.NUMBER, description: "Optional maximum price in USD" },
          },
          required: ["query"],
        },
      },
      {
        name: "check_policy",
        description: "Check a product (by id from search_products) against the spending policy.",
        parameters: {
          type: Type.OBJECT,
          properties: { productId: { type: Type.STRING, description: "Product id" } },
          required: ["productId"],
        },
      },
      {
        name: "propose_purchase",
        description: "Propose buying a product. Only works if the policy allows it.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            productId: { type: Type.STRING, description: "Product id" },
            reason: { type: Type.STRING, description: "Why this is the best choice" },
          },
          required: ["productId", "reason"],
        },
      },
    ],
  },
];
// If Gemini says "too many requests", wait the time it suggests and try again.
async function generateWithRetry(ai: GoogleGenAI, params: any, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      const text = String(error);
      const rateLimited =
        text.includes('"code":429') || text.includes("RESOURCE_EXHAUSTED");
      if (!rateLimited || attempt >= tries) throw error;
      const match = text.match(/retry in ([\d.]+)s/i);
      const seconds = Math.min(match ? Number(match[1]) : 20, 40);
      console.warn(`[agent] rate limited, waiting ${Math.ceil(seconds)}s (try ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, (seconds + 1) * 1000));
    }
  }
}

export async function runAgent(message: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

  const seen = new Map<string, Product>(); // products found during this run
  const log: LogLine[] = [];
  let proposal: Proposal | null = null;
  let step = 0;

  // The tools. Prices always come from our own data (seen), never from Gemini.
  async function runTool(name: string, args: any): Promise<unknown> {
    if (name === "search_products") {
      const found = await searchProducts(String(args.query ?? ""), {
        maxPrice: typeof args.maxPrice === "number" ? args.maxPrice : undefined,
        limit: 6,
      });
      found.forEach((p) => seen.set(p.id, p));
      return {
        products: found.map((p) => ({
          id: p.id,
          title: p.title,
          brand: p.brand,
          retailer: p.retailer,
          price: p.price,
          currency: p.currency,
          listPrice: p.listPrice,
          inStock: p.inStock,
        })),
      };
    }

    const product = seen.get(String(args.productId ?? ""));
    if (!product) return { error: "Unknown productId. Search first and use an id from the results." };

    if (name === "check_policy") {
      return checkPurchase(product, spentThisMonth());
    }

    if (name === "propose_purchase") {
      // THE GUARDRAIL: the policy is re-checked here in code, whatever Gemini says.
      const policy = checkPurchase(product, spentThisMonth());
      if (!policy.allowed) {
        return { accepted: false, reasons: policy.reasons };
      }
      proposal = { product, reason: String(args.reason ?? ""), policy };
      return { accepted: true, needsApproval: policy.needsApproval, reasons: policy.reasons };
    }

    return { error: `Unknown tool ${name}` };
  }

  const contents: any[] = [{ role: "user", parts: [{ text: message }] }];
  let reply = "";

  for (let i = 0; i < 6; i++) {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction: SYSTEM_PROMPT, tools: TOOLS },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      reply = response.text ?? "";
      break;
    }

    // Keep Gemini's own turn in the history, then answer each tool call.
    contents.push(response.candidates![0].content);
    const results: any[] = [];
    for (const call of calls) {
      step += 1;
      const result = await runTool(call.name ?? "", call.args ?? {});
      log.push({ step, tool: call.name ?? "", args: call.args, result });
      addEntry({
        type: "decision",
        summary: `Agent called ${call.name}`,
        detail: { args: call.args, result },
      });
      results.push({ functionResponse: { name: call.name, response: { result } } });
    }
    contents.push({ role: "user", parts: results });
  }

  if (!reply) {
    reply = proposal
      ? "I found an option within policy. Please review the proposal."
      : "I could not find an option that fits the policy.";
  }
  return { reply, proposal, log };
}