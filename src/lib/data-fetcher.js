import { db } from "./firebase";
import { doc, getDoc, getDocs, collection, onSnapshot } from "firebase/firestore";

// Simple in-memory cache for Firestore documents and catalog
const docCache = {};
let catalogPromise = null;

const makeSlug = (text = "") =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

/**
 * Fetch a single document and cache its promise/data.
 */
export async function fetchDocCached(path) {
    if (docCache[path]) {
        return docCache[path];
    }
    if (!docCache[path + "_promise"]) {
        docCache[path + "_promise"] = (async () => {
            try {
                const parts = path.split("/");
                const docRef = doc(db, ...parts);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    docCache[path] = data;
                    return data;
                }
                return null;
            } catch (err) {
                console.error(`Error fetching doc at ${path}:`, err);
                // Clear promise on error to allow retries
                delete docCache[path + "_promise"];
                throw err;
            }
        })();
    }
    return docCache[path + "_promise"];
}

/**
 * Fetch and process the entire products catalog (categories, subcategories, legacy list).
 * Caches the result globally to eliminate repeat network reads during client-side navigation.
 */
export async function fetchFullCatalog() {
    if (catalogPromise) {
        return catalogPromise;
    }

    catalogPromise = (async () => {
        const startTime = performance.now();
        try {
            // 1. Fetch categories
            const categorySnap = await getDocs(
                collection(
                    db,
                    "websites",
                    "clinidixcom",
                    "pages",
                    "categoryproducts",
                    "categories"
                )
            );

            const allProducts = [];

            // Fetch all subcategories in parallel to solve N+1 issue
            await Promise.all(
                categorySnap.docs.map(async (categoryDoc) => {
                    const data = categoryDoc.data();
                    const categoryName = data.category || categoryDoc.id;

                    try {
                        const subcategoriesCol = collection(
                            db,
                            "websites",
                            "clinidixcom",
                            "pages",
                            "categoryproducts",
                            "categories",
                            categoryDoc.id,
                            "subcategories"
                        );

                        const subcategoriesSnap = await getDocs(subcategoriesCol);

                        subcategoriesSnap.forEach((subDoc) => {
                            const subData = subDoc.data();
                            const subCategoryName = subData.subCategory || subDoc.id;

                            const categoryProducts = (subData.products || [])
                                .filter((p) => p.isPublished !== false)
                                .map((item, index) => ({
                                    ...item,
                                    uid: `${categoryDoc.id}-${subDoc.id}-${index}`,
                                    category: categoryName,
                                    subCategory: subCategoryName,
                                    slug: item.slug || makeSlug(item.title),
                                }));

                            allProducts.push(...categoryProducts);
                        });
                    } catch (subErr) {
                        console.error(`Error fetching subcategories for category ${categoryDoc.id}:`, subErr);
                    }

                    // Fallback direct category products
                    if (data.products?.length) {
                        const directProducts = data.products
                            .filter((p) => p.isPublished !== false)
                            .map((item, index) => ({
                                ...item,
                                uid: `${categoryDoc.id}-direct-${index}`,
                                category: categoryName,
                                subCategory: item.subCategory || categoryName,
                                slug: item.slug || makeSlug(item.title),
                            }));
                        allProducts.push(...directProducts);
                    }
                })
            );

            // Fetch old legacy products
            try {
                const oldSnap = await getDoc(
                    doc(
                        db,
                        "websites",
                        "clinidixcom",
                        "pages",
                        "products"
                    )
                );

                if (oldSnap.exists()) {
                    const oldProducts = (oldSnap.data().products || [])
                        .filter((p) => p.isPublished !== false)
                        .map((item, index) => ({
                            ...item,
                            uid: `other-${index}`,
                            category: "Other Products",
                            subCategory: item.subCategory || "Other Products",
                            slug: item.slug || makeSlug(item.title),
                        }));

                    allProducts.push(...oldProducts);
                }
            } catch (oldErr) {
                console.error("Error fetching legacy products:", oldErr);
            }

            const duration = performance.now() - startTime;
            console.log(`[data-fetcher] Raw Firestore fetchFullCatalog completed in ${duration.toFixed(2)}ms`);

            return allProducts;
        } catch (err) {
            console.error("Error fetching full catalog:", err);
            // Clear cache promise on error to allow retries
            catalogPromise = null;
            throw err;
        }
    })();

    return catalogPromise;
}

/**
 * Helpers for cached document retrieval across pages
 */
export async function fetchHomeData() {
    return fetchDocCached("websites/clinidixcom/pages/home");
}

export async function fetchContactData() {
    return fetchDocCached("websites/clinidixcom/pages/contact");
}

export async function fetchServicesData() {
    return fetchDocCached("websites/clinidixcom/pages/services");
}

export async function fetchDistrictData(district) {
    if (!district) return null;
    return fetchDocCached(`websites/clinidixcom/districts/${district}`);
}

/**
 * Subscribe to catalog changes in real-time.
 * Invokes onUpdate with the rebuilt products list whenever categories,
 * subcategories, or legacy products change.
 * Returns an unsubscribe function.
 */
export function subscribeToCatalog(onUpdate) {
    const categoriesCol = collection(
        db,
        "websites",
        "clinidixcom",
        "pages",
        "categoryproducts",
        "categories"
    );

    let categoryDataMap = new Map();
    let subcategoriesDataMap = new Map(); // key: categoryId -> Map of (subcategoryId -> subDoc data)
    let legacyProducts = [];
    const subUnsubs = new Map(); // key: categoryId -> unsub function
    let unsubscribes = [];

    function rebuildCatalogAndNotify() {
        const allProducts = [];

        // 1. Process category docs
        for (const [categoryId, catData] of categoryDataMap.entries()) {
            const categoryName = catData.category || categoryId;

            // Subcategories products
            const subMap = subcategoriesDataMap.get(categoryId);
            if (subMap) {
                for (const [subId, subData] of subMap.entries()) {
                    const subCategoryName = subData.subCategory || subId;
                    const categoryProducts = (subData.products || [])
                        .filter((p) => p.isPublished !== false)
                        .map((item, index) => ({
                            ...item,
                            uid: `${categoryId}-${subId}-${index}`,
                            category: categoryName,
                            subCategory: subCategoryName,
                            slug: item.slug || makeSlug(item.title),
                        }));
                    allProducts.push(...categoryProducts);
                }
            }

            // Fallback direct category products
            if (catData.products?.length) {
                const directProducts = catData.products
                    .filter((p) => p.isPublished !== false)
                    .map((item, index) => ({
                        ...item,
                        uid: `${categoryId}-direct-${index}`,
                        category: categoryName,
                        subCategory: item.subCategory || categoryName,
                        slug: item.slug || makeSlug(item.title),
                    }));
                allProducts.push(...directProducts);
            }
        }

        // Add legacy products
        allProducts.push(...legacyProducts);

        onUpdate(allProducts);
    }

    // Listen to legacy products
    try {
        const legacyUnsub = onSnapshot(
            doc(db, "websites", "clinidixcom", "pages", "products"),
            (docSnap) => {
                if (docSnap.exists()) {
                    legacyProducts = (docSnap.data().products || [])
                        .filter((p) => p.isPublished !== false)
                        .map((item, index) => ({
                            ...item,
                            uid: `other-${index}`,
                            category: "Other Products",
                            subCategory: item.subCategory || "Other Products",
                            slug: item.slug || makeSlug(item.title),
                        }));
                } else {
                    legacyProducts = [];
                }
                rebuildCatalogAndNotify();
            },
            (err) => {
                console.error("Error in legacy products snapshot:", err);
            }
        );
        unsubscribes.push(legacyUnsub);
    } catch (err) {
        console.error("Failed to setup legacy products listener:", err);
    }

    // Listen to categories
    try {
        const categoriesUnsub = onSnapshot(
            categoriesCol,
            (categorySnap) => {
                // Clean up listeners and data for deleted categories
                const currentCategoryIds = new Set(categorySnap.docs.map((d) => d.id));
                for (const catId of categoryDataMap.keys()) {
                    if (!currentCategoryIds.has(catId)) {
                        categoryDataMap.delete(catId);
                        subcategoriesDataMap.delete(catId);
                        if (subUnsubs.has(catId)) {
                            subUnsubs.get(catId)();
                            subUnsubs.delete(catId);
                        }
                    }
                }

                categorySnap.docs.forEach((categoryDoc) => {
                    const catId = categoryDoc.id;
                    categoryDataMap.set(catId, categoryDoc.data());

                    // Set up listener for subcategories if not already listening
                    if (!subUnsubs.has(catId)) {
                        const subCol = collection(
                            db,
                            "websites",
                            "clinidixcom",
                            "pages",
                            "categoryproducts",
                            "categories",
                            catId,
                            "subcategories"
                        );

                        const subUnsub = onSnapshot(
                            subCol,
                            (subSnap) => {
                                const subMap = new Map();
                                subSnap.docs.forEach((subDoc) => {
                                    subMap.set(subDoc.id, subDoc.data());
                                });
                                subcategoriesDataMap.set(catId, subMap);
                                rebuildCatalogAndNotify();
                            },
                            (subErr) => {
                                console.error(`Error in subcategories snapshot for ${catId}:`, subErr);
                            }
                        );
                        subUnsubs.set(catId, subUnsub);
                    }
                });

                rebuildCatalogAndNotify();
            },
            (err) => {
                console.error("Error in categories snapshot:", err);
            }
        );
        unsubscribes.push(categoriesUnsub);
    } catch (err) {
        console.error("Failed to setup categories listener:", err);
    }

    // Return unsubscribe all function
    return () => {
        unsubscribes.forEach((unsub) => unsub());
        subUnsubs.forEach((unsub) => unsub());
    };
}
