"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import ServiceCard from "@/components/ServiceCard";
import {
  Microscope,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Wrench,
  Activity,
  Award,
  Zap,
  CheckCircle2,
  PhoneCall,
  FileCheck,
  Cpu,
} from "lucide-react";
import { fallbackServices } from "@/data/servicesData";

const workflowSteps = [
  {
    step: "01",
    title: "Diagnostic Audit & Consultation",
    desc: "We analyze your hospital sample load, space constraints, and technical requirements to select the exact analyzer configuration.",
    icon: FileCheck,
  },
  {
    step: "02",
    title: "Precision Solution Engineering",
    desc: "Custom lab layout designs, power backup specifications, and reagent supply schedule formulation.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "Installation & NABL Calibration",
    desc: "Certified engineers perform physical installation, IQ/OQ/PQ protocols, and NABL-traceable reference calibration.",
    icon: Award,
  },
  {
    step: "04",
    title: "24/7 SLA Field Maintenance",
    desc: "Round-the-clock technical emergency support, scheduled preventive maintenance visits, and automated reagent restocking.",
    icon: Zap,
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState(fallbackServices);
  const [contactInfo, setContactInfo] = useState([]);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);
  const staticRoutes = ["about", "services", "products", "contact", "items"];
  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const makeLink = (path) => {
    if (!district) return path;
    if (path === "/") return `/${district}`;
    return `/${district}${path}`;
  };

  const icons = [
    <Microscope size={28} key={1} />,
    <FlaskConical size={28} key={2} />,
    <ShieldCheck size={28} key={3} />,
    <Stethoscope size={28} key={4} />,
    <Wrench size={28} key={5} />,
    <Activity size={28} key={6} />,
  ];

  useEffect(() => {
    const fetchServicesAndContact = async () => {
      try {
        const [servicesSnap, contactSnap] = await Promise.all([
          getDoc(doc(db, "websites", "clinidixcom", "pages", "services")),
          getDoc(doc(db, "websites", "clinidixcom", "pages", "contact")),
        ]);

        if (servicesSnap.exists() && servicesSnap.data().services?.length > 0) {
          const dbServices = servicesSnap.data().services.map((s, idx) => ({
            ...fallbackServices[idx % fallbackServices.length],
            title: s.title || fallbackServices[idx % fallbackServices.length].title,
            desc: s.desc || fallbackServices[idx % fallbackServices.length].desc,
          }));
          setServices(dbServices);
        }

        if (contactSnap.exists()) {
          setContactInfo(contactSnap.data().contactInfo || []);
        }
      } catch (error) {
        console.error("Error loading services/contact data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServicesAndContact();
  }, []);

  // Dynamically extract emergency helpline phone number
  const emergencyPhone = (() => {
    const item = contactInfo.find((c) => {
      const l = (c?.label || "").toLowerCase();
      return (
        l.includes("phone") ||
        l.includes("mobile") ||
        l.includes("helpline") ||
        l.includes("emergency") ||
        l.includes("tel") ||
        l.includes("contact")
      );
    });
    if (!item) return "";
    if (Array.isArray(item.value)) return item.value[0] || "";
    return typeof item.value === "string" ? item.value.trim() : "";
  })();

  return (
    <div className="bg-[#FFF9EF]/40 text-[#38240D]">
      {/* Banner */}
      <PageBanner
        badge="Technical Services"
        title="Biomedical Support From Setup to Service"
        subtitle="NABL-certified calibration, 2-hour emergency repair SLAs, cold-chain reagent distribution, and turnkey pathology setup."
      />

      {/* Services Grid Section */}
      <section className="section-padding bg-gradient-to-b from-white via-[#FFF9EF] to-[#FDFBD4]">
        <div className="container-custom">
          <SectionTitle
            badge="Full Service Catalog"
            title="Designed Around Reliable Operations"
            description="Explore our specialized services designed to keep clinical laboratories and hospital departments operating at peak accuracy."
            center
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <ServiceCard
                key={service.id || index}
                icon={icons[index % icons.length]}
                title={service.title}
                description={service.desc}
                badge={service.badge}
                turnaround={service.turnaround}
                highlights={service.highlights}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Process Section */}
      <section className="section-padding bg-white border-y border-[#E8D3BC]/60">
        <div className="container-custom">
          <SectionTitle
            badge="Execution Framework"
            title="Our 4-Step Engineering Workflow"
            description="A systematic process ensuring seamless integration, rapid compliance, and long-term instrument reliability."
            center
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E8D3BC] bg-[#FFF9EF] p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#C05800] hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-black text-[#C05800]/40 group-hover:text-[#C05800] transition-colors">
                        {step.step}
                      </span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#C05800] shadow-sm">
                        <Icon size={24} />
                      </div>
                    </div>

                    <h3 className="mt-6 text-xl font-bold text-[#38240D] group-hover:text-[#C05800] transition-colors">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#5B4634]">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E8D3BC]/40">
                    <span className="text-xs font-bold text-[#713600]">Phase {index + 1} Milestone</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Breakdown SLA Box */}
      <section className="section-padding bg-gradient-to-b from-[#FDFBD4] via-white to-[#FFF9EF]">
        <div className="container-custom">
          <div className="rounded-3xl border border-[#E8D3BC] bg-gradient-to-r from-[#38240D] to-[#5B4634] p-8 sm:p-12 text-white shadow-xl">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#C05800] px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <Zap size={14} /> Emergency Breakdown Helpline
                </span>

                <h3 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  Facing an Equipment Emergency in ICU or Lab?
                </h3>

                <p className="mt-3 text-base text-[#E8D3BC] leading-relaxed">
                  Our certified field engineers are equipped with OEM diagnostic kits and genuine spare parts for instant on-site restoration.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#C05800]" />
                    <span>2-Hour On-Site SLA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#C05800]" />
                    <span>Loaner Analyzer Option</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#C05800]" />
                    <span>NABL Re-calibration Included</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-t lg:border-t-0 lg:border-l border-[#E8D3BC]/20 pt-6 lg:pt-0 lg:pl-8">
                <p className="text-xs font-bold uppercase tracking-wider text-[#E8D3BC]">Emergency Dispatch</p>
                {emergencyPhone ? (
                  <a
                    href={`tel:${emergencyPhone.replace(/\s+/g, "")}`}
                    className="mt-2 text-2xl font-black text-white hover:text-[#FBBF24] transition-colors inline-block"
                  >
                    {emergencyPhone}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-[#E8D3BC]">24/7 Field Dispatch Active</p>
                )}
                <Link
                  href={makeLink("/contact")}
                  className="mt-5 w-full rounded-2xl bg-[#C05800] py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all hover:bg-[#713600]"
                >
                  Book Priority Repair
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}