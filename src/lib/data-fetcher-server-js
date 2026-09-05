import { fetchFullCatalog as fetchFullCatalogRaw } from "./data-fetcher";
import { cache } from "react";

// Global in-memory cache for the server process to bypass Next.js 2MB unstable_cache limit
let cachedCatalog = null;
let cachedCatalogTimestamp = 0;
const CACHE_TTL = process.env.NODE_ENV === "development" ? 1000 : 3600 * 1000; // 1 second in dev, 1 hour in prod

async function getCachedCatalog() {
  const now = Date.now();
  if (cachedCatalog && (now - cachedCatalogTimestamp) < CACHE_TTL) {
    console.log(`[data-fetcher-server] Serving catalog from server memory cache (${((now - cachedCatalogTimestamp) / 1000).toFixed(1)}s old)`);
    return cachedCatalog;
  }

  console.log("[data-fetcher-server] Server memory cache miss or expired. Fetching raw catalog from Firestore...");
  const data = await fetchFullCatalogRaw();
  cachedCatalog = data;
  cachedCatalogTimestamp = now;
  return data;
}

export const fetchFullCatalog = cache(async () => {
  const start = performance.now();
  const products = await getCachedCatalog();
  const end = performance.now();
  console.log(`[data-fetcher-server] fetchFullCatalog took ${(end - start).toFixed(2)}ms`);
  return products;
});
