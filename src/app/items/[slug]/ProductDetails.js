"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { fallbackProducts, makeSlug } from "@/data/productsData";
import { fetchAllDynamicProducts } from "@/lib/fetchProducts";

import {
    FaPlay,
    FaShareAlt,
    FaWhatsapp,
    FaFacebook,
    FaInstagram,
    FaLink,
} from "react-icons/fa";

import {
    doc,
    getDoc,
    addDoc,
    collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Microscope, ArrowRight, ShieldCheck, Download, CheckCircle2 } from "lucide-react";

const loadImageBase64 = async (src) => {
    try {
        if (!src || typeof src !== "string") {
            throw new Error("Invalid image source");
        }

        if (!src.startsWith("http")) {
            return new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    try {
                        resolve(canvas.toDataURL("image/png"));
                    } catch (e) {
                        reject(e);
                    }
                };
                img.onerror = (e) => reject(e);
                img.src = src;
            });
        }

        // Method 1: Fetch via local proxy (bypasses CORS securely)
        try {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error("FileReader failed"));
                    reader.readAsDataURL(blob);
                });
            }
        } catch (proxyErr) {
            console.warn("Proxy method failed, falling back to direct fetch...", proxyErr);
        }

        // Method 2: Direct fetch fallback
        try {
            const response = await fetch(src, { cache: "no-cache" });
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error("FileReader failed"));
                    reader.readAsDataURL(blob);
                });
            }
        } catch (fetchErr) {
            console.warn("fetch method failed, falling back to canvas method...", fetchErr);
        }

        // Method 3: Fallback to HTML Image element
        return await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                try {
                    resolve(canvas.toDataURL("image/png"));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (e) => reject(new Error("Image element load failed"));
            img.src = src;
        });
    } catch (err) {
        console.error("loadImageBase64 failed for src:", src, err);
        throw err;
    }
};

export default function ProductDetails({ slug }) {
    const [product, setProduct] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedMedia, setSelectedMedia] = useState("image");
    const [showShare, setShowShare] = useState(false);
    const [contactInfo, setContactInfo] = useState([]);
    const [downloadingBrochure, setDownloadingBrochure] = useState(false);

    const shareRef = useRef();
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const pathname = usePathname();

    const specificationsList = useMemo(() => {
        if (!product) return [];
        const list = [];
        const added = new Set();

        const addSpec = (label, val) => {
            if (val === null || val === undefined || typeof val === "object") return;
            const strVal = String(val).trim();
            if (!strVal || strVal === "N/A" || strVal.toLowerCase() === "null" || strVal.toLowerCase() === "undefined") return;
            const keyLower = label.toLowerCase().trim();
            if (!added.has(keyLower)) {
                added.add(keyLower);
                list.push({ label, value: strVal });
            }
        };

        // Standard dynamic admin fields
        if (product.brand) addSpec("Brand", product.brand);
        if (product.model) addSpec("Model", product.model);
        if (product.instrument) addSpec("Instrument", product.instrument);
        if (product.capacity) addSpec("Capacity", product.capacity);
        if (product.throughput) addSpec("Throughput", product.throughput);
        if (product.usage) addSpec("Usage / Application", product.usage);
        if (product.automation) addSpec("Automation", product.automation);
        if (product.size) addSpec("Size / Dimensions", product.size);
        if (product.availability || product.status) addSpec("Availability", product.availability || product.status);
        if (product.category) addSpec("Category", product.category);
        if (product.subCategory) addSpec("Sub Category", product.subCategory);
        if (product.categoryProductId) addSpec("Product ID", product.categoryProductId);

        // Parse parameters string if given in admin
        if (product.parameters && typeof product.parameters === "string") {
            if (product.parameters.includes("|") || product.parameters.includes(":")) {
                const parts = product.parameters.split("|");
                parts.forEach((part) => {
                    const colonIndex = part.indexOf(":");
                    if (colonIndex !== -1) {
                        const lbl = part.substring(0, colonIndex).trim();
                        const val = part.substring(colonIndex + 1).trim();
                        if (lbl && val) {
                            addSpec(lbl.replace(/\b\w/g, (c) => c.toUpperCase()), val);
                        }
                    } else if (part.trim()) {
                        addSpec("Parameters", part.trim());
                    }
                });
            } else {
                addSpec("Parameters", product.parameters);
            }
        }

        // Parse custom specs object if provided
        if (product.specs && typeof product.specs === "object") {
            if (Array.isArray(product.specs)) {
                product.specs.forEach((item) => {
                    if (item && item.label && item.value) {
                        addSpec(item.label, item.value);
                    } else if (typeof item === "string" && item.includes(":")) {
                        const [k, v] = item.split(":");
                        addSpec(k.trim(), v.trim());
                    }
                });
            } else {
                Object.entries(product.specs).forEach(([k, v]) => {
                    if (v && typeof v !== "object") {
                        const cleanLabel = k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
                        addSpec(cleanLabel, v);
                    }
                });
            }
        }

        return list;
    }, [product]);

    const pathParts = pathname.split("/").filter(Boolean);
    const city = pathParts.length > 1 ? pathParts[0] : "India";
    const cityName = city.charAt(0).toUpperCase() + city.slice(1);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const allProducts = await fetchAllDynamicProducts();

                let found = allProducts.find(
                    (p) => p.slug === slug || makeSlug(p.title) === slug || p.id === slug
                );

                if (!found) {
                    found = fallbackProducts.find(
                        (p) => p.slug === slug || makeSlug(p.title) === slug || p.id === slug
                    );
                }

                if (!found && fallbackProducts.length > 0) {
                    const prettyTitle = slug
                        ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        : "Biomedical Equipment";
                    found = {
                        ...fallbackProducts[0],
                        title: prettyTitle,
                        slug: slug || "biomedical-equipment",
                    };
                }

                setProduct(found);

                if (found) {
                    const mainImg =
                        (Array.isArray(found.images) && found.images[0]) ||
                        found.image ||
                        found.imgUrl ||
                        found.imageUrl ||
                        "/logo.png";
                    setSelectedImage(mainImg);
                    setSelectedMedia("image");
                }
            } catch (error) {
                console.error("Error loading product:", error);
            }
        };

        loadProduct();
    }, [slug]);

    useEffect(() => {
        const loadContact = async () => {
            try {
                const snap = await getDoc(
                    doc(db, "websites", "coolpacksin", "pages", "contact")
                );
                if (snap.exists()) {
                    setContactInfo(snap.data().contactInfo || []);
                }
            } catch (err) {
                console.error("Error loading contact info in details:", err);
            }
        };
        loadContact();
    }, []);

    const handleDownloadBrochure = async () => {
        if (!product) return;
        try {
            setDownloadingBrochure(true);
            const { jsPDF } = await import("jspdf");
            const pdfDoc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            // Load logo
            let logoBase64 = null;
            try {
                logoBase64 = await loadImageBase64("/logo.png");
            } catch (e) {
                console.error("Error loading brochure logo:", e);
            }

            // Load product image
            const imgUrl =
                product.image ||
                product.imageUrl ||
                product.imgUrl ||
                (product.images && product.images[0]);
            let productImgBase64 = null;
            if (imgUrl && imgUrl !== "/logo.png") {
                try {
                    productImgBase64 = await loadImageBase64(imgUrl);
                } catch (e) {
                    console.error("Error loading product image for brochure:", e);
                }
            }

            // Layout Dimensions
            const margin = 15;
            const pageWidth = 210;
            const pageHeight = 297;
            const contentWidth = pageWidth - 2 * margin;

            // Slate Theme Colors
            const colorPrimary = [30, 41, 59];       // #1e293b Dark Slate
            const colorDark = [15, 23, 42];          // #0f172a Deep Slate Text
            const colorGray = [100, 116, 139];       // #64748b Subtitle Text
            const colorLightBorder = [226, 232, 240];// #e2e8f0 Light Border
            const colorBgWarm = [248, 250, 252];     // #f8fafc Slate Background

            // 1. HEADER
            let headerLeftOffset = margin;
            if (logoBase64) {
                try {
                    pdfDoc.addImage(logoBase64, "PNG", margin, 14, 14, 14);
                    headerLeftOffset += 18;
                } catch (imgErr) {
                    console.warn("Could not render logo in PDF:", imgErr);
                }
            }

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(16);
            pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            pdfDoc.text("Raj Biosis Private Limited", headerLeftOffset, 20);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.setFontSize(8.5);
            pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
            pdfDoc.text("Biomedical & Diagnostic Equipment Supplier | NABL Traceable Calibration", headerLeftOffset, 25);

            pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
            pdfDoc.setLineWidth(0.4);
            pdfDoc.line(margin, 32, pageWidth - margin, 32);

            // 2. PRODUCT TITLE & CATEGORY
            let curY = 40;
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(15);
            pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            const splitTitle = pdfDoc.splitTextToSize(product.title, contentWidth);
            pdfDoc.text(splitTitle, margin, curY);
            curY += splitTitle.length * 6 + 2;

            if (product.category) {
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(9);
                pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
                pdfDoc.text(`CATEGORY: ${product.category.toUpperCase()}`, margin, curY);
                curY += 6;
            }

            // 3. PRODUCT IMAGE & SHORT DESCRIPTION
            if (productImgBase64) {
                try {
                    pdfDoc.addImage(productImgBase64, "PNG", margin, curY, 60, 50);
                    pdfDoc.setFont("helvetica", "normal");
                    pdfDoc.setFontSize(9);
                    pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
                    const descText = product.desc || product.description || "Certified biomedical instrument designed for accurate clinical testing.";
                    const splitDesc = pdfDoc.splitTextToSize(descText, contentWidth - 66);
                    pdfDoc.text(splitDesc, margin + 66, curY + 6);
                    curY += 56;
                } catch (imgErr) {
                    curY += 6;
                }
            } else {
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(9);
                pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
                const descText = product.desc || product.description || "Certified biomedical instrument designed for accurate clinical testing.";
                const splitDesc = pdfDoc.splitTextToSize(descText, contentWidth);
                pdfDoc.text(splitDesc, margin, curY);
                curY += splitDesc.length * 5 + 8;
            }

            // 4. SPECIFICATIONS TABLE
            if (specificationsList.length > 0 && curY < 230) {
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(11);
                pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
                pdfDoc.text("TECHNICAL SPECIFICATIONS", margin, curY);
                curY += 6;

                specificationsList.slice(0, 12).forEach((item, idx) => {
                    if (curY > 260) return;
                    pdfDoc.setFillColor(idx % 2 === 0 ? colorBgWarm[0] : 255, idx % 2 === 0 ? colorBgWarm[1] : 255, idx % 2 === 0 ? colorBgWarm[2] : 255);
                    pdfDoc.rect(margin, curY - 4, contentWidth, 6.5, "F");

                    pdfDoc.setFont("helvetica", "bold");
                    pdfDoc.setFontSize(8);
                    pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
                    pdfDoc.text(String(item.label), margin + 3, curY);

                    pdfDoc.setFont("helvetica", "normal");
                    pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
                    pdfDoc.text(String(item.value), margin + 60, curY);

                    curY += 6.5;
                });
            }

            // 5. FOOTER
            pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
            pdfDoc.setLineWidth(0.4);
            pdfDoc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

            pdfDoc.setFont("helvetica", "italic");
            pdfDoc.setFontSize(7.5);
            pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
            pdfDoc.text(
                "Raj Biosis Private Limited | NABL-Traceable Calibration • 24/7 SLA Engineering Support",
                pageWidth / 2,
                pageHeight - 9,
                { align: "center" }
            );

            pdfDoc.save(`${product.title.replace(/\s+/g, "_")}_Brochure.pdf`);
            toast.success("Brochure downloaded successfully!");
        } catch (e) {
            console.error("Error creating PDF brochure:", e);
            toast.error("Failed to generate brochure PDF.");
        } finally {
            setDownloadingBrochure(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneRegex = /^[6-9]\d{9}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!form.name.trim()) {
            return toast.error("Name is required");
        }
        if (!emailRegex.test(form.email)) {
            return toast.error("Enter valid email");
        }
        if (!phoneRegex.test(form.phone)) {
            return toast.error("Enter valid mobile number");
        }

        try {
            setSubmitting(true);
            await addDoc(
                collection(
                    db,
                    "websitesQueries",
                    "coolpacksin",
                    "productQueries"
                ),
                {
                    ...form,
                    productName: product.title,
                    productSlug: product.slug,
                    brand: product.brand || "",
                    model: product.model || "",
                    createdAt: new Date(),
                }
            );

            toast.success("Your enquiry has been submitted successfully.");
            setForm({
                name: "",
                email: "",
                phone: "",
            });
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link Copied");
        setShowShare(false);
    };

    const handleWhatsapp = () => {
        const shareText = `🔬 ${product?.title}\n\n${product?.desc || product?.description || ""}\n\n🌐 ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    };

    const handleFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
    };

    const handleInstagram = async () => {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Instagram direct sharing not available. Link copied.");
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: product.title,
                text: product.desc,
                url: window.location.href,
            });
        } else {
            setShowShare(!showShare);
        }
    };

    useEffect(() => {
        const close = (e) => {
            if (shareRef.current && !shareRef.current.contains(e.target)) {
                setShowShare(false);
            }
        };

        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    if (!product) {
        return (
            <section className="py-10 md:py-20 bg-slate-50">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12">
                        <div className="h-[420px] md:h-[520px] rounded-[36px] bg-slate-200 animate-pulse" />
                        <div>
                            <div className="h-12 w-3/4 bg-slate-200 rounded-xl animate-pulse mb-8" />
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-6 bg-slate-200 rounded-lg animate-pulse mb-4" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-10 md:py-16 bg-slate-50 text-slate-900">
            <div className="container-custom">
                {/* Breadcrumb */}
                <div className="mb-6 text-sm text-slate-500 font-medium">
                    Home / Products / <span className="text-slate-800">{product.title}</span>
                </div>

                {/* Main 2-Column Grid */}
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                    {/* LEFT COLUMN: Gallery & Compact Quote Form directly underneath */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                        {/* Image Gallery */}
                        <div className="relative h-[320px] sm:h-[380px] md:h-[420px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm flex items-center justify-center p-6">
                            {/* Premium Badge */}
                            <div className="absolute left-5 top-5 z-20 rounded-full bg-slate-800 px-3.5 py-1 text-xs font-semibold text-white shadow-md">
                                Premium Diagnostic Quality
                            </div>

                            {selectedMedia === "video" && product.video ? (
                                <video controls autoPlay className="h-full w-full object-contain p-6">
                                    <source src={product.video} type="video/mp4" />
                                </video>
                            ) : (
                                <>
                                    {!imageLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
                                            <div className="h-16 w-16 rounded-full border-4 border-slate-300 border-t-slate-800 animate-spin" />
                                        </div>
                                    )}

                                    {(selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])) && (selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])) !== "/logo.png" ? (
                                        <Image
                                            src={selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])}
                                            alt={product.title || "Product"}
                                            fill
                                            priority
                                            onLoad={() => setImageLoaded(true)}
                                            className="object-contain p-6 transition-all duration-500"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 text-slate-800 shadow-sm">
                                                <Microscope size={38} />
                                            </div>
                                            <span className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-700">
                                                {product.category || "Biomedical Analyzer"}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Thumbnail Bar (if multiple media) */}
                        {((Array.isArray(product.images) && product.images.length > 1) || product.video || product.pdf) && (
                            <div className="flex flex-wrap gap-3">
                                {((Array.isArray(product.images) && product.images.length > 0)
                                    ? product.images
                                    : [product.image || product.imgUrl || product.imageUrl || selectedImage]
                                ).filter((img) => img && img !== "/logo.png").map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setSelectedImage(img);
                                            setSelectedMedia("image");
                                        }}
                                        className={`group relative h-16 w-16 overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                                            selectedMedia === "image" && selectedImage === img
                                                ? "border-slate-800 shadow-md shadow-slate-900/10"
                                                : "border-slate-200 hover:border-slate-400"
                                        }`}
                                    >
                                        <Image
                                            src={img}
                                            alt={`Thumbnail ${index + 1}`}
                                            width={64}
                                            height={64}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </button>
                                ))}

                                {product.video && (
                                    <button
                                        onClick={() => setSelectedMedia("video")}
                                        className="group flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 transition-all hover:border-slate-800"
                                    >
                                        <FaPlay size={16} className="text-slate-800" />
                                        <span className="mt-1 text-[10px] font-semibold text-slate-700">Video</span>
                                    </button>
                                )}

                                {product.pdf && (
                                    <a
                                        href={product.pdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 transition-all hover:border-slate-800"
                                    >
                                        <span className="text-lg">📄</span>
                                        <span className="mt-0.5 text-[10px] font-semibold text-slate-700">PDF</span>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Quick Inquiry Quote Form - directly below image with minimal gap */}
                        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-md shadow-slate-900/5">
                            <span className="inline-flex rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-slate-800">
                                Quick Quote Inquiry
                            </span>

                            <h3 className="mt-3 text-xl font-black text-slate-900">
                                Inquire Price & Availability
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Inquiring for: <strong className="text-slate-800">{product.title}</strong>
                            </p>

                            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Your Full Name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10"
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10"
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="10-Digit Mobile Number"
                                    maxLength={10}
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10"
                                    required
                                />

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-xl bg-slate-800 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-slate-900 disabled:opacity-60"
                                >
                                    {submitting ? "Submitting..." : "Get Official Quote"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Title, Actions, Overview, Single Specs Grid, Information & FAQs */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Title & Action Buttons Header */}
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                                {product.subCategory && product.subCategory !== product.category
                                    ? `${product.category} • ${product.subCategory}`
                                    : product.category || "Biomedical Equipment"}
                            </span>

                            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-slate-900">
                                {product.title}
                            </h1>

                            {/* Actions: Download Brochure + Share */}
                            <div className="mt-6 flex flex-wrap items-center gap-4">
                                <button
                                    onClick={handleDownloadBrochure}
                                    disabled={downloadingBrochure}
                                    className="group inline-flex items-center gap-2.5 rounded-2xl bg-slate-800 px-6 py-3.5 text-sm font-bold !text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900 disabled:opacity-75"
                                >
                                    <Download size={18} className="!text-white" />
                                    <span>{downloadingBrochure ? "Generating..." : "Download Brochure"}</span>
                                </button>

                                {/* Share Button */}
                                <div ref={shareRef} className="relative">
                                    <button
                                        onClick={handleNativeShare}
                                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-800 hover:text-white"
                                        aria-label="Share Product"
                                    >
                                        <FaShareAlt size={16} />
                                    </button>

                                    {showShare && (
                                        <div className="absolute right-0 top-14 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                                            <button onClick={handleCopy} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                                                <FaLink className="text-slate-500" />
                                                <span>Copy Link</span>
                                            </button>
                                            <button onClick={handleWhatsapp} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                                                <FaWhatsapp className="text-emerald-600" />
                                                <span>WhatsApp</span>
                                            </button>
                                            <button onClick={handleFacebook} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                                                <FaFacebook className="text-blue-600" />
                                                <span>Facebook</span>
                                            </button>
                                            <button onClick={handleInstagram} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                                                <FaInstagram className="text-pink-600" />
                                                <span>Instagram</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Product Overview & Description */}
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                            <span className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-800">
                                Product Details
                            </span>

                            <h3 className="mt-4 text-2xl font-black text-slate-900">
                                Comprehensive Overview
                            </h3>

                            <p className="mt-4 text-base leading-8 text-slate-600">
                                {product.desc || product.description || "Certified biomedical equipment engineered for clinical accuracy, robust laboratory workflows, and international regulatory standards."}
                            </p>

                            {/* Features list if available */}
                            {Array.isArray(product.features) && product.features.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                                        Key Highlights & Capabilities
                                    </h4>
                                    <div className="grid sm:grid-cols-2 gap-2.5">
                                        {product.features.map((feat, fIdx) => (
                                            <div key={fIdx} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                                <CheckCircle2 size={16} className="text-slate-800 shrink-0" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product Specifications - ONLY ONCE! */}
                        {specificationsList.length > 0 && (
                            <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                                <span className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-800">
                                    Technical Data
                                </span>

                                <h3 className="mt-4 text-2xl font-black text-slate-900 mb-6">
                                    Technical Specifications
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {specificationsList.map((item, index) => (
                                        <div
                                            key={index}
                                            className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all hover:border-slate-300"
                                        >
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                {item.label}
                                            </p>
                                            <p className="mt-1.5 text-base font-bold text-slate-900 break-words">
                                                {item.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Information & Procurement Cards */}
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                            <span className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-800">
                                Information & Procurement
                            </span>

                            <div className="mt-6 space-y-4">
                                {[
                                    {
                                        title: `Why Choose Raj Biosis in ${cityName}?`,
                                        content: `Raj Biosis Private Limited is a trusted supplier and distributor of ${product.title} in ${cityName}. We provide high-quality biomedical and laboratory equipment for hospitals, pathology laboratories, diagnostic centres and healthcare facilities.`,
                                    },
                                    {
                                        title: `Applications & Clinical Utility`,
                                        content: `Widely used in hospitals, pathology laboratories, diagnostic centres, blood banks, research institutes and healthcare facilities for accurate and efficient diagnostics.`,
                                    },
                                    {
                                        title: `${product.title} Supplier in ${cityName}`,
                                        content: `Raj Biosis supplies ${product.title} in ${cityName} with expert consultation, installation support, technical guidance and dependable after-sales service.`,
                                    },
                                ].map((item, index) => (
                                    <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition-all hover:border-slate-300">
                                        <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Frequently Asked Questions */}
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                            <span className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-800">
                                Help Center
                            </span>

                            <h3 className="mt-4 text-2xl font-black text-slate-900">
                                Frequently Asked Questions
                            </h3>

                            <div className="mt-6 space-y-3.5">
                                {[
                                    {
                                        question: `What is ${product.title} used for in ${cityName}?`,
                                        answer: `${product.title} is commonly used in hospitals, pathology laboratories, diagnostic centres and healthcare facilities for accurate diagnostic and laboratory applications.`,
                                    },
                                    {
                                        question: `What is the price of ${product.title} in ${cityName}?`,
                                        answer: `The price depends on the model, configuration and specifications. Contact our team for the latest quotation and availability.`,
                                    },
                                    {
                                        question: `Are you an authorized supplier of ${product.title}?`,
                                        answer: `Yes. We supply genuine biomedical and laboratory equipment sourced from trusted manufacturers and brands.`,
                                    },
                                    {
                                        question: "Do you provide installation and calibration support?",
                                        answer: `Yes. NABL calibration certificates, technical assistance, and after-sales support are provided for all eligible equipment.`,
                                    },
                                ].map((item, index) => (
                                    <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                                        <h4 className="text-sm sm:text-base font-bold text-slate-900">{item.question}</h4>
                                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}