"use client";

import { useEffect, useState, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { fetchAllDynamicProducts } from "@/lib/fetchProducts";

export default function Footer() {
  const [contactInfo, setContactInfo] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districtData, setDistrictData] = useState(null);

  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);

  const staticRoutes = [
    "about",
    "services",
    "products",
    "contact",
    "items",
    "api",
  ];

  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const makeLink = (path) => {
    if (!district) return path;
    if (path === "/") {
      return `/${district}`;
    }
    if (path.startsWith("/items?")) {
      return `/${district}${path}`;
    }
    return `/${district}${path.startsWith("/") ? path : `/${path}`}`;
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // 1. Fetch Contact Info
        try {
          const snap = await getDoc(
            doc(db, "websites", "clinidixcom", "pages", "contact")
          );
          if (isMounted && snap.exists()) {
            setContactInfo(snap.data().contactInfo || []);
          }
        } catch (contactErr) {
          console.error("Error loading footer contact:", contactErr);
        }

        // 2. Fetch Dynamic Product Categories
        try {
          const prods = await fetchAllDynamicProducts();
          if (isMounted && Array.isArray(prods) && prods.length > 0) {
            const catSet = new Set();
            prods.forEach((p) => {
              if (p.category && String(p.category).trim() && String(p.category).trim() !== "All Categories") {
                catSet.add(String(p.category).trim());
              }
            });
            setCategories(Array.from(catSet));
          }
        } catch (prodErr) {
          console.error("Error loading footer categories:", prodErr);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadDistrict = async () => {
      if (!district) return;

      try {
        const snap = await getDoc(
          doc(db, "websites", "clinidixcom", "districts", district)
        );

        if (snap.exists()) {
          setDistrictData(snap.data());
        }
      } catch (err) {
        console.error("Error loading footer district:", err);
      }
    };

    loadDistrict();
  }, [district]);

  // Extract phone numbers flexibly from Firestore contactInfo
  const phoneItems = contactInfo.filter((item) => {
    const l = (item?.label || "").toLowerCase();
    return (
      l.includes("phone") ||
      l.includes("mobile") ||
      l.includes("tel") ||
      l.includes("contact")
    );
  });

  const phones = phoneItems
    .flatMap((item) =>
      Array.isArray(item.value) ? item.value : [item.value]
    )
    .filter((v) => typeof v === "string" && v.trim() !== "");

  // Extract emails flexibly
  const emailItem = contactInfo.find((item) => {
    const l = (item?.label || "").toLowerCase();
    return l.includes("email") || l.includes("mail");
  });
  const emails = emailItem
    ? (Array.isArray(emailItem.value)
        ? emailItem.value
        : [emailItem.value]
      ).filter((v) => typeof v === "string" && v.trim() !== "")
    : [];

  // Extract address flexibly
  const addressItem = contactInfo.find((item) => {
    const l = (item?.label || "").toLowerCase();
    return (
      l.includes("address") ||
      l.includes("office") ||
      l.includes("location") ||
      l.includes("headquarter")
    );
  });
  const rawAddress = addressItem
    ? Array.isArray(addressItem.value)
      ? addressItem.value.filter(Boolean).join(", ")
      : typeof addressItem.value === "string"
      ? addressItem.value.trim()
      : ""
    : "";

  const dynamicAddress = districtData
    ? `${districtData.district}, ${districtData.state}, India`
    : rawAddress;

  // Fallback list of top categories if database has none yet
  const displayCategories = useMemo(() => {
    if (categories.length > 0) return categories.slice(0, 6);
    return [
      "Diagnostic Analyzers",
      "Molecular Diagnostics",
      "Hospital & ICU Gear",
      "Laboratory Equipment",
      "Reagents & Consumables",
    ];
  }, [categories]);

  if (loading) {
    return (
      <footer className="border-t border-[#E8D3BC] bg-[#FDFBD4]">
        <div className="container-custom py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="mb-6 h-8 w-40 animate-pulse rounded bg-[#EAD9C4]" />
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className="mb-4 h-5 animate-pulse rounded bg-[#F3E4D2]"
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-[#E8D3BC] pt-6">
            <div className="h-5 w-72 animate-pulse rounded bg-[#EAD9C4]" />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-[#E8D3BC] bg-gradient-to-b from-white via-[#FFF9EF] to-[#FDFBD4]">
      <div className="container-custom py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company & Social */}
          <div className="flex flex-col justify-between">
            <div>
              <Link
                href={makeLink("/")}
                className="relative block h-16 w-52 shrink-0 mb-4 transition-transform hover:scale-105"
              >
                <Image
                  src="/logo.png"
                  alt="Raj Biosis Private Limited"
                  fill
                  className="object-contain object-left"
                />
              </Link>

              <p className="mt-3 text-sm leading-relaxed text-[#5B4634]">
                Delivering certified biomedical and diagnostic instruments, NABL calibration standards, and 24/7 technical field engineering support across India.
              </p>
            </div>

            {/* Social Media Links */}
            <div className="mt-6 pt-4 border-t border-[#E8D3BC]/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#713600] mb-3">
                Follow Us
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/rajbiosispvtltd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Raj Biosis on Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E8D3BC] bg-white text-[#1877F2] shadow-sm transition-all duration-300 hover:scale-110 hover:bg-[#1877F2] hover:text-white hover:shadow-md"
                >
                  <FaFacebook size={20} />
                </a>

                <a
                  href="https://www.instagram.com/rajbiosisindia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Raj Biosis on Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E8D3BC] bg-white text-[#E4405F] shadow-sm transition-all duration-300 hover:scale-110 hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:text-white hover:shadow-md"
                >
                  <FaInstagram size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-[#38240D]">
              Quick Links
            </h3>
            <div className="flex flex-col gap-3 text-sm font-medium">
              {[
                { name: "Home", link: "/" },
                { name: "About Us", link: "/about" },
                { name: "Our Services", link: "/services" },
                { name: "Products & Catalog", link: "/items" },
                { name: "Contact & Support", link: "/contact" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={makeLink(item.link)}
                  className="text-[#5B4634] transition-all duration-300 hover:translate-x-1.5 hover:text-[#C05800] flex items-center gap-1.5"
                >
                  <ArrowRight size={14} className="text-[#C05800] opacity-60" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Dynamic Categories */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-[#38240D]">
              Product Categories
            </h3>
            <div className="flex flex-col gap-2.5 text-sm font-medium">
              {displayCategories.map((cat, idx) => (
                <Link
                  key={idx}
                  href={makeLink(`/items?category=${encodeURIComponent(cat)}`)}
                  className="text-[#5B4634] transition-all duration-300 hover:translate-x-1.5 hover:text-[#C05800] flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C05800]" />
                  <span className="truncate">{cat}</span>
                </Link>
              ))}
              <Link
                href={makeLink("/items")}
                className="mt-2 text-xs font-bold text-[#C05800] hover:underline"
              >
                View Full Catalog →
              </Link>
            </div>
          </div>

          {/* Contact Info - Purely Dynamic from Firestore */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-[#38240D]">
              Contact Info
            </h3>

            <div className="space-y-4 text-[#5B4634]">
              {dynamicAddress && (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E4D2]">
                    <MapPin size={18} className="text-[#C05800]" />
                  </div>
                  <p className="leading-6 text-sm">{dynamicAddress}</p>
                </div>
              )}

              {phones.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E4D2]">
                    <Phone size={18} className="text-[#C05800]" />
                  </div>
                  <div className="flex flex-col gap-1 text-sm font-semibold">
                    {phones.map((p, idx) => (
                      <a
                        key={idx}
                        href={`tel:${String(p).replace(/\s+/g, "")}`}
                        className="hover:text-[#C05800] transition-colors"
                      >
                        {p}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {emails.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E4D2]">
                    <Mail size={18} className="text-[#C05800]" />
                  </div>
                  <div className="flex flex-col gap-1 text-sm font-semibold">
                    {emails.map((em, idx) => (
                      <a
                        key={idx}
                        href={`mailto:${em}`}
                        className="hover:text-[#C05800] transition-colors break-all"
                      >
                        {em}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!dynamicAddress && phones.length === 0 && emails.length === 0 && (
                <p className="text-xs text-[#713600]">
                  Contact info will appear here once configured in the Admin panel.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar with Copyright & Social Icon Backup */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#E8D3BC] pt-8 text-sm text-[#6B5A4A] md:flex-row">
          <p>© 2026 Raj Biosis Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/rajbiosispvtltd/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5B4634] hover:text-[#1877F2] transition-colors"
              aria-label="Facebook"
            >
              <FaFacebook size={18} />
            </a>
            <a
              href="https://www.instagram.com/rajbiosisindia/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5B4634] hover:text-[#E4405F] transition-colors"
              aria-label="Instagram"
            >
              <FaInstagram size={18} />
            </a>
            <span className="text-xs text-[#713600]">
              Empowering Precision Healthcare Nationwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}