"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
  Microscope,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Building2,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Mail,
  Wrench,
  Activity,
  Award,
  Clock,
  HeartPulse,
  Sparkles,
  ChevronRight,
  Zap,
} from "lucide-react";

import SectionTitle from "@/components/SectionTitle";
import ServiceCard from "@/components/ServiceCard";
import ProductCard from "@/components/ProductCard";
import ContactForm from "@/components/ContactForm";
import HeroCarousel from "@/components/HeroCarousel";
import { fallbackProducts } from "@/data/productsData";
import { fallbackServices } from "@/data/servicesData";
import { fetchAllDynamicProducts } from "@/lib/fetchProducts";

const stats = [
  {
    number: "5,000+",
    title: "Healthcare Partners",
    desc: "Hospitals & labs served nationwide",
    icon: Building2,
  },
  {
    number: "3,500+",
    title: "Products & Kits",
    desc: "Precision diagnostic instruments",
    icon: Microscope,
  },
  {
    number: "10+ Yrs",
    title: "Engineering Excellence",
    desc: "Proven biomedical leadership",
    icon: ShieldCheck,
  },
  {
    number: "99.9%",
    title: "Accuracy SLA",
    desc: "NABL & ISO certified standards",
    icon: Award,
  },
];

const pillars = [
  {
    title: "Certified Calibration Standards",
    desc: "Every diagnostic analyzer undergoes NABL-traceable calibration to ensure precise patient diagnostics and regulatory safety.",
    icon: Award,
    badge: "ISO 13485 Certified",
  },
  {
    title: "24/7 Emergency AMC Response",
    desc: "Our nationwide team of biomedical engineers delivers rapid on-site maintenance to keep critical ICU and OT gear active.",
    icon: Zap,
    badge: "2-Hour SLA",
  },
  {
    title: "Turnkey Lab Setup & Engineering",
    desc: "From architectural workflow layout to instrument installation and staff certification, we engineer complete pathology labs.",
    icon: Building2,
    badge: "Turnkey Engineering",
  },
  {
    title: "Cold-Chain Reagent Supply",
    desc: "Strictly temperature-monitored distribution of biochemistry reagents, controls, and rapid assay kits with extended shelf life.",
    icon: FlaskConical,
    badge: "Monitored Cold Chain",
  },
];

const testimonials = [
  {
    quote: "Raj Biomedical transformed our central laboratory setup. Their automated analyzers increased our daily sample throughput by 40% with zero downtime.",
    author: "Dr. Arvind Sharma",
    role: "Chief Pathologist",
    institution: "Apollo Diagnostics Center",
    rating: 5,
  },
  {
    quote: "The 24/7 AMC response team is outstanding. When our ICU patient monitor system faced a sensor issue, their engineer arrived within 90 minutes.",
    author: "Dr. Meenakshi Sundaram",
    role: "Medical Director",
    institution: "Metro Multispecialty Hospital",
    rating: 5,
  },
  {
    quote: "Their cold-chain reagent delivery has never failed us. Quality control results are consistently accurate, month after month.",
    author: "Rajesh Varma",
    role: "Laboratory Operations Manager",
    institution: "LifeCare PathLabs",
    rating: 5,
  },
];

export default function Home({ city }) {
  const [services, setServices] = useState(fallbackServices);
  const [products, setProducts] = useState(fallbackProducts);
  const [activeCategory, setActiveCategory] = useState("All");
  const [homeData, setHomeData] = useState(null);
  const [contactInfo, setContactInfo] = useState([]);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);

  const staticRoutes = ["about", "services", "items", "contact"];
  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const locationTitle = city || (district ? district.replace(/-/g, " ") : "");

  const makeLink = (path) => {
    if (!district) return path;
    if (path === "/") return `/${district}`;
    return `/${district}${path}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch home page configuration (title, description, buttons, carousel media)
        try {
          const homeSnap = await getDoc(
            doc(db, "websites", "clinidixcom", "pages", "home")
          );
          if (homeSnap.exists()) {
            setHomeData(homeSnap.data());
          }
        } catch (homeErr) {
          console.error("Error fetching home data:", homeErr);
        }

        // Fetch contact information for dynamic helpline info
        try {
          const contactSnap = await getDoc(
            doc(db, "websites", "clinidixcom", "pages", "contact")
          );
          if (contactSnap.exists()) {
            setContactInfo(contactSnap.data().contactInfo || []);
          }
        } catch (contactErr) {
          console.error("Error fetching contact data:", contactErr);
        }

        // Fetch services from Firebase if available
        const serviceSnap = await getDoc(
          doc(db, "websites", "clinidixcom", "pages", "services")
        );
        if (serviceSnap.exists() && serviceSnap.data().services?.length > 0) {
          const dbServices = serviceSnap.data().services.map((s, idx) => ({
            ...fallbackServices[idx % fallbackServices.length],
            title: s.title || fallbackServices[idx % fallbackServices.length].title,
            desc: s.desc || fallbackServices[idx % fallbackServices.length].desc,
          }));
          setServices(dbServices);
        }

        // Fetch products dynamically from Firestore
        const fetchedProducts = await fetchAllDynamicProducts();
        if (fetchedProducts && fetchedProducts.length > 0) {
          setProducts(fetchedProducts);
        }
      } catch (err) {
        console.error("Using fallback data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    activeCategory === "All"
      ? products.slice(0, 6)
      : products.filter((p) => p.category === activeCategory).slice(0, 6);

  const serviceIcons = [
    <Microscope size={28} key={1} />,
    <Building2 size={28} key={2} />,
    <Wrench size={28} key={3} />,
    <FlaskConical size={28} key={4} />,
    <Stethoscope size={28} key={5} />,
    <Award size={28} key={6} />,
  ];

  // Helper to extract dynamic phone from contact info
  const helplinePhone = (() => {
    const item = contactInfo.find(
      (c) =>
        c?.label?.toLowerCase().includes("phone") ||
        c?.label?.toLowerCase().includes("mobile") ||
        c?.label?.toLowerCase().includes("helpline") ||
        c?.label?.toLowerCase().includes("contact")
    );
    if (!item) return "";
    if (Array.isArray(item.value)) return item.value[0] || "";
    return typeof item.value === "string" ? item.value.trim() : "";
  })();

  // Helper to extract dynamic email from contact info
  const supportEmail = (() => {
    const item = contactInfo.find(
      (c) =>
        c?.label?.toLowerCase().includes("email") ||
        c?.label?.toLowerCase().includes("mail")
    );
    if (!item) return "";
    if (Array.isArray(item.value)) return item.value[0] || "";
    return typeof item.value === "string" ? item.value.trim() : "";
  })();

  return (
    <div className="bg-[#FFF9EF]/40 text-[#38240D]">
      {/* ================= DYNAMIC HERO BANNER & CAROUSEL ================= */}
      <HeroCarousel
        homeData={homeData}
        locationTitle={locationTitle}
        makeLink={makeLink}
      />

      {/* ================= STATS TICKER ================= */}
      <section className="bg-gradient-to-r from-[#38240D] via-[#5B4634] to-[#38240D] py-10 text-white shadow-inner">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#C05800]/25 text-[#E4C5A2] border border-[#C05800]/40">
                    <Icon size={26} />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {item.number}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-[#E4C5A2]">{item.title}</p>
                    <p className="text-[11px] text-[#E8D3BC]/80 hidden sm:block">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= PILLARS / WHY CHOOSE US ================= */}
      <section className="section-padding bg-gradient-to-b from-white via-[#FFF9EF] to-[#FDFBD4]">
        <div className="container-custom">
          <SectionTitle
            badge="Why Modern Labs Choose Us"
            title="Engineered for the Workday"
            description="A disciplined industrial interface for laboratories, hospitals, and technical teams."
            center
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={index}
                  className="group relative flex flex-col justify-between rounded-3xl border border-[#E8D3BC] bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-[#C05800]/50 hover:shadow-2xl hover:shadow-[#C05800]/15"
                >
                  <div>
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3E4D2] text-[#C05800] transition-all duration-300 group-hover:bg-[#C05800] group-hover:text-white group-hover:scale-110 shadow-sm">
                      <Icon size={28} />
                    </div>

                    <span className="mb-3 inline-block rounded-full bg-[#FFF9EF] border border-[#E8D3BC] px-3 py-1 text-xs font-bold text-[#713600]">
                      {pillar.badge}
                    </span>

                    <h3 className="mb-3 text-xl font-bold text-[#38240D] group-hover:text-[#C05800] transition-colors">
                      {pillar.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-[#5B4634]">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#E8D3BC]/40 flex items-center gap-2 text-xs font-bold text-[#C05800]">
                    <span>Learn standard</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS SHOWCASE ================= */}
      <section className="section-padding bg-white border-y border-[#E8D3BC]/50">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <SectionTitle
              badge="Diagnostic Inventory"
              title="Equipment Worth Exploring"
              description="Explore our curated catalog of automated clinical analyzers, PCR units, ICU patient monitors, and laboratory centrifuges."
            />

            <Link
              href={makeLink("/items")}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#FFF9EF] border border-[#E8D3BC] px-6 py-3.5 text-sm font-bold text-[#C05800] shadow-sm transition-all hover:bg-[#C05800] hover:text-white hover:border-[#C05800] shrink-0"
            >
              <span>View All Products</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Category Tabs */}
          <div className="mt-10 flex flex-wrap items-center gap-3 border-b border-[#E8D3BC]/60 pb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${activeCategory === cat
                  ? "bg-[#C05800] text-white shadow-md shadow-[#C05800]/20"
                  : "bg-[#FFF9EF] border border-[#E8D3BC] text-[#5B4634] hover:bg-[#F3E4D2]"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} makeLink={makeLink} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= SERVICES MATRIX ================= */}
      <section className="section-padding bg-gradient-to-b from-[#FDFBD4] via-white to-[#FFF9EF]">
        <div className="container-custom">
          <SectionTitle
            badge="Healthcare Solutions"
            title="Support Built Around Your Workflow"
            description="From NABL-certified calibration to 2-hour emergency repair response, our certified engineers support your clinical operations round the clock."
            center
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((srv, idx) => (
              <ServiceCard
                key={srv.id || idx}
                icon={serviceIcons[idx % serviceIcons.length]}
                title={srv.title}
                description={srv.desc}
                badge={srv.badge}
                turnaround={srv.turnaround}
                highlights={srv.highlights}
                makeLink={makeLink}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= ISO & QUALITY CERTIFICATION BANNER ================= */}
      <section className="section-padding bg-[#38240D] text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-[#C05800]/20 blur-3xl" />
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#C05800]/30 border border-[#C05800]/50 px-4 py-1.5 text-xs font-bold text-[#E4C5A2] uppercase tracking-wider">
                <Award size={16} /> Quality Assurance & Compliance
              </span>

              <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Uncompromised Clinical Accuracy & Regulatory Standards
              </h2>

              <p className="mt-4 text-base sm:text-lg text-[#E8D3BC]/90 leading-relaxed">
                Raj Biosisstrictly adheres to international quality protocols. Every equipment installation comes with complete IQ/OQ/PQ validation documentation and certified calibration reports.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#E8D3BC]/20 bg-white/5 p-5 backdrop-blur-sm">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[#C05800]" />
                    ISO 13485 & CE Compliance
                  </h4>
                  <p className="mt-2 text-xs text-[#E8D3BC]/80">
                    Certified medical device quality management system for diagnostic analyzers.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E8D3BC]/20 bg-white/5 p-5 backdrop-blur-sm">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock size={20} className="text-[#C05800]" />
                    2-Hour SLA Maintenance
                  </h4>
                  <p className="mt-2 text-xs text-[#E8D3BC]/80">
                    Dedicated engineer dispatch team ready for emergency hospital repairs.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-[#E8D3BC]/30 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-md text-center">
                <div className="mx-auto flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#E06D00] via-[#C05800] to-[#8C3E00] text-white shadow-2xl shadow-[#C05800]/50 border-2 border-amber-300/40 p-2">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                    100%
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FDFBD4] mt-1">
                    Certified
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">
                  Compliance Guarantee
                </h3>
                <p className="mt-3 text-sm text-[#E8D3BC] leading-relaxed">
                  All instruments tested with traceable reference standards before dispatch to your medical facility.
                </p>
                <Link
                  href={makeLink("/contact")}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C05800] !text-white px-8 py-3.5 text-sm font-bold shadow-xl shadow-[#C05800]/40 transition-all hover:bg-[#E06D00] hover:shadow-2xl hover:-translate-y-0.5 border border-amber-400/30"
                >
                  <span className="!text-white font-bold">Request Inspection Certificate</span>
                  <ArrowRight size={16} className="!text-white" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="section-padding bg-gradient-to-b from-white via-[#FFF9EF] to-[#FDFBD4]">
        <div className="container-custom">
          <SectionTitle
            badge="What Our Partners Say"
            title="Chosen by Diagnostic Teams"
            description="Read how healthcare professionals rely onRaj Biosisfor accurate diagnostics and uninterrupted equipment uptime."
            center
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-3xl border border-[#E8D3BC] bg-white p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <div className="flex gap-1 text-[#C05800] mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-[#5B4634] italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="mt-8 border-t border-[#E8D3BC]/60 pt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3E4D2] text-[#C05800] font-bold text-lg">
                    {t.author.charAt(4) || "D"}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#38240D]">{t.author}</h4>
                    <p className="text-xs text-[#5B4634]">{t.role} — <span className="text-[#C05800] font-medium">{t.institution}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= QUICK INQUIRY FORM SECTION ================= */}
      <section className="section-padding bg-gradient-to-br from-[#FDFBD4] via-white to-[#F3E4D2] border-t border-[#E8D3BC]">
        <div className="container-custom">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <SectionTitle
                badge="Direct Consultation"
                title="Planning a Purchase or Need Technical Guidance?"
                description="Our biomedical engineering consultants will analyze your laboratory requirements, recommend optimal instruments, and provide a customized quote."
              />

              <div className="mt-8 space-y-4">
                {helplinePhone && (
                  <a
                    href={`tel:${String(helplinePhone).replace(/\s+/g, "")}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#E8D3BC] bg-white p-4 shadow-sm hover:border-[#C05800]/40 transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3E4D2] text-[#C05800] shrink-0">
                      <PhoneCall size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#5B4634]">Direct Helpline</p>
                      <p className="text-base font-bold text-[#38240D]">{helplinePhone}</p>
                    </div>
                  </a>
                )}

                {supportEmail && (
                  <a
                    href={`mailto:${supportEmail}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#E8D3BC] bg-white p-4 shadow-sm hover:border-[#C05800]/40 transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3E4D2] text-[#C05800] shrink-0">
                      <Mail size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#5B4634]">Official Email</p>
                      <p className="text-base font-bold text-[#38240D] break-all">{supportEmail}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              <ContactForm
                title="Request a Tailored Equipment Plan"
                subtitle="Fill out the form below and our equipment specialist will reach out within 2 hours."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}