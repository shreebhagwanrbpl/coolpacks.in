import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    doc,
    getDoc,
} from "firebase/firestore";

export default async function sitemap() {
    const baseUrl =
        "https://clinidix.com";

    const urls = [];

    // Static Pages
    urls.push(
        {
            url: baseUrl,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/services`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/items`,
            lastModified: new Date(),
        }
    );

    try {
        // DISTRICTS
        const districtSnap =
            await getDocs(
                collection(
                    db,
                    "websites",
                    "clinidixcom",
                    "districts"
                )
            );

        const districts =
            districtSnap.docs.map(
                (doc) => doc.data()
            );

        districts.forEach((district) => {
            const slug =
                district.slug;

            if (!slug) return;

            urls.push(
                {
                    url: `${baseUrl}/${slug}`,
                    lastModified:
                        new Date(),
                },
                {
                    url: `${baseUrl}/${slug}/about`,
                    lastModified:
                        new Date(),
                },
                {
                    url: `${baseUrl}/${slug}/services`,
                    lastModified:
                        new Date(),
                },
                {
                    url: `${baseUrl}/${slug}/contact`,
                    lastModified:
                        new Date(),
                },
                {
                    url: `${baseUrl}/${slug}/items`,
                    lastModified:
                        new Date(),
                }
            );
        });

        // PRODUCTS
        const productDoc =
            await getDoc(
                doc(
                    db,
                    "websites",
                    "clinidixcom",
                    "pages",
                    "products"
                )
            );

        const products =
            productDoc.data()
                ?.products || [];

        products.forEach(
            (product) => {
                if (!product.slug) return;

                // Main Product URL
                urls.push({
                    url: `${baseUrl}/items/${product.slug}`,
                    lastModified:
                        new Date(),
                });

                // District Product URLs
                districts.forEach(
                    (district) => {
                        if (!district.slug) return;

                        urls.push({
                            url: `${baseUrl}/${district.slug}/items/${product.slug}`,
                            lastModified:
                                new Date(),
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error(
            "Sitemap Error:",
            error
        );
    }

    return urls;
}