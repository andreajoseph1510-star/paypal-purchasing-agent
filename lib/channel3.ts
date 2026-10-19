import { Channel3 } from "@channel3/sdk";

// The simple product shape the rest of the app uses.
export type Product = {
  id: string;
  title: string;
  brand: string | null;
  retailer: string;
  price: number;
  currency: string;
  listPrice: number | null;
  inStock: boolean;
  imageUrl: string | null;
  buyUrl: string;
  description: string | null;
  source: "channel3" | "fallback";
};

// Used when Channel3 fails or returns nothing, so the demo never breaks.
const FALLBACK_CATALOG: Product[] = [
  { id: "fb-1", title: "Waterproof Hiking Jacket", brand: "TrailPeak", retailer: "example-outdoor.com", price: 89.99, currency: "USD", listPrice: 129.99, inStock: true, imageUrl: null, buyUrl: "https://example.com/jacket", description: "Lightweight waterproof shell jacket.", source: "fallback" },
  { id: "fb-2", title: "Ergonomic Office Chair", brand: "SitWell", retailer: "example-office.com", price: 149.0, currency: "USD", listPrice: 219.0, inStock: true, imageUrl: null, buyUrl: "https://example.com/chair", description: "Adjustable chair with lumbar support.", source: "fallback" },
  { id: "fb-3", title: "Standing Desk Lamp (LED)", brand: "BrightDesk", retailer: "example-office.com", price: 34.5, currency: "USD", listPrice: null, inStock: true, imageUrl: null, buyUrl: "https://example.com/lamp", description: "Dimmable LED desk lamp.", source: "fallback" },
  { id: "fb-4", title: "Wireless Keyboard and Mouse Set", brand: "KeyFlow", retailer: "example-tech.com", price: 42.99, currency: "USD", listPrice: 59.99, inStock: true, imageUrl: null, buyUrl: "https://example.com/keyboard", description: "Quiet wireless keyboard and mouse.", source: "fallback" },
  { id: "fb-5", title: "Whiteboard Markers (12 pack)", brand: "WriteOn", retailer: "example-supplies.com", price: 12.99, currency: "USD", listPrice: null, inStock: true, imageUrl: null, buyUrl: "https://example.com/markers", description: "Assorted dry-erase markers.", source: "fallback" },
  { id: "fb-6", title: "27-inch 4K Monitor", brand: "ViewMax", retailer: "example-tech.com", price: 329.0, currency: "USD", listPrice: 399.0, inStock: true, imageUrl: null, buyUrl: "https://example.com/monitor", description: "4K IPS monitor with USB-C.", source: "fallback" },
];

// Turn one Channel3 product into our simple shape, choosing the cheapest in-stock offer.
function normalize(p: any): Product | null {
  const offers: any[] = (p?.offers ?? []).filter(
    (o: any) => typeof o?.price?.price === "number"
  );
  if (offers.length === 0) return null;

  const inStock = offers.filter((o) => o.availability === "InStock");
  const pool = inStock.length > 0 ? inStock : offers;
  const offer = pool.reduce((a, b) => (b.price.price < a.price.price ? b : a));
  const image = p.images?.find((i: any) => i.is_main_image) ?? p.images?.[0];

  return {
    id: p.id,
    title: p.title,
    brand: p.brands?.[0]?.name ?? null,
    retailer: offer.domain,
    price: offer.price.price,
    currency: offer.price.currency ?? "USD",
    listPrice: offer.price.compare_at_price ?? null,
    inStock: offer.availability === "InStock",
    imageUrl: image?.url ?? null,
    buyUrl: offer.url,
    description: p.description ?? null,
    source: "channel3",
  };
}

function searchFallback(query: string, maxPrice?: number): Product[] {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  let matches = FALLBACK_CATALOG.filter((p) => {
    const text = `${p.title} ${p.description ?? ""}`.toLowerCase();
    return words.some((w) => text.includes(w));
  });
  if (matches.length === 0) matches = FALLBACK_CATALOG; // keep the demo alive
  if (maxPrice !== undefined) matches = matches.filter((p) => p.price <= maxPrice);
  return matches;
}

export async function searchProducts(
  query: string,
  options: { maxPrice?: number; limit?: number } = {}
): Promise<Product[]> {
  const { maxPrice, limit = 8 } = options;
  try {
    const client = new Channel3(); // reads CHANNEL3_API_KEY from .env.local
    const results: any = await client.products.search({ query, limit });
    let products = ((results?.response?.products ?? []) as any[])
      .map(normalize)
      .filter((p): p is Product => p !== null);
    if (maxPrice !== undefined) products = products.filter((p) => p.price <= maxPrice);
    if (products.length > 0) return products;
  } catch (error) {
    console.warn("[channel3] search failed, using fallback catalog:", error);
  }
  return searchFallback(query, maxPrice);
}