import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { fallbackProducts, makeSlug } from "@/data/productsData";
import { fetchFullCatalog } from "@/lib/data-fetcher";

/**
 * Standardizes raw Firestore product/item document object to standard shape
 */
export function normalizeProduct(item, defaultCategory = "Diagnostic Equipment") {
  if (!item || typeof item !== "object") return null;

  const title = (item.title || item.name || item.productName || item.itemName || "").trim();
  if (!title) return null;

  const rawSlug = item.slug || item.productSlug || item.itemSlug || makeSlug(title);
  const category = item.category || item.categoryName || defaultCategory || "Diagnostic Equipment";
  const subCategory = item.subCategory || item["sub category"] || item.subCategoryName || "";

  const description =
    item.desc ||
    item.description ||
    item.detail ||
    item.summary ||
    "";

  const image =
    item.image ||
    item.imgUrl ||
    item.imageUrl ||
    (Array.isArray(item.images) && item.images[0]) ||
    "";

  let images = Array.isArray(item.images) && item.images.length > 0 ? item.images : image ? [image] : [];

  let features = Array.isArray(item.features)
    ? item.features.filter(Boolean)
    : typeof item.features === "string"
    ? item.features.split(",").map((f) => f.trim()).filter(Boolean)
    : [];

  return {
    ...item,
    id: item.uid || item.id || item.categoryProductId || rawSlug,
    categoryProductId: item.categoryProductId || "",
    title,
    slug: rawSlug,
    category,
    subCategory,
    description,
    desc: description,
    price: item.price || "",
    capacity: item.capacity || "",
    throughput: item.throughput || "",
    instrument: item.instrument || "",
    model: item.model || "",
    usage: item.usage || "",
    brand: item.brand || "",
    parameters: item.parameters || "",
    automation: item.automation || "",
    availability: item.availability || item.status || "",
    size: item.size || "",
    features,
    specs: item.specs && typeof item.specs === "object" ? item.specs : null,
    badge: item.badge || item.tag || "",
    status: item.status || item.availability || "In Stock",
    image,
    images,
    video: item.video || "",
    pdf: item.pdf || "",
    isPublished: item.isPublished !== false,
  };
}

/**
 * Fetches dynamic products from all possible Firestore locations used by admin panel
 */
export async function fetchAllDynamicProducts() {
  const productsMap = new Map();

  const addItems = (itemsArray, defaultCat) => {
    if (!Array.isArray(itemsArray)) return;
    itemsArray.forEach((raw) => {
      const p = normalizeProduct(raw, defaultCat);
      if (p && p.slug && !productsMap.has(p.slug)) {
        productsMap.set(p.slug, p);
      }
    });
  };

  try {
    // 1. Fetch full catalog via data-fetcher (subcategories, category products, legacy products)
    const fullCatalog = await fetchFullCatalog();
    if (Array.isArray(fullCatalog) && fullCatalog.length > 0) {
      addItems(fullCatalog);
    }

    // 2. Fetch extra fallback collections if any
    const extraSnapshots = await Promise.allSettled([
      getDocs(collection(db, "websites", "clinidixcom", "products")),
      getDocs(collection(db, "websites", "clinidixcom", "items")),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "items")),
    ]);

    extraSnapshots.forEach((res) => {
      if (res.status === "fulfilled" && !res.value.empty) {
        res.value.forEach((docSnap) => {
          addItems([{ id: docSnap.id, ...docSnap.data() }]);
        });
      }
    });
  } catch (err) {
    console.error("Error fetching dynamic products from Firestore:", err);
  }

  const fetchedList = Array.from(productsMap.values());
  if (fetchedList.length > 0) {
    return fetchedList;
  }

  return fallbackProducts;
}
