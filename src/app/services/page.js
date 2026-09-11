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
  FileCheck,
  Cpu,
} from "lucide-react";


// ============================================================
// STATIC WORKFLOW CONTENT
// NOTE:
// These are workflow/process content, NOT service fallback data.
// ============================================================

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


// ============================================================
// SERVICES PAGE
// ============================================================

export default function ServicesPage() {

  // ----------------------------------------------------------
  // DYNAMIC FIREBASE SERVICES ONLY
  // ----------------------------------------------------------

  const [services, setServices] = useState([]);

  const [contactInfo, setContactInfo] = useState([]);

  const [loading, setLoading] = useState(true);


  // ----------------------------------------------------------
  // DISTRICT / CITY ROUTE
  // ----------------------------------------------------------

  const pathname = usePathname();

  const pathParts = pathname.split("/").filter(Boolean);

  const staticRoutes = [
    "about",
    "services",
    "products",
    "contact",
    "items",
  ];

  const district =
    pathParts.length > 0 &&
      !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";


  // ----------------------------------------------------------
  // DYNAMIC LINKS
  // ----------------------------------------------------------

  const makeLink = (path) => {

    if (!district) {
      return path;
    }

    if (path === "/") {
      return `/${district}`;
    }

    return `/${district}${path}`;
  };


  // ----------------------------------------------------------
  // STATIC ICONS
  // Icons are only visual.
  // Service title/description remain Firebase dynamic.
  // ----------------------------------------------------------

  const icons = [
    <Microscope size={28} key={1} />,
    <FlaskConical size={28} key={2} />,
    <ShieldCheck size={28} key={3} />,
    <Stethoscope size={28} key={4} />,
    <Wrench size={28} key={5} />,
    <Activity size={28} key={6} />,
  ];


  // ==========================================================
  // FETCH SERVICES + CONTACT FROM FIREBASE
  // ==========================================================

  useEffect(() => {

    let isMounted = true;

    const fetchServicesAndContact = async () => {

      try {

        const [servicesSnap, contactSnap] = await Promise.all([
          getDoc(
            doc(
              db,
              "websites",
              "coolpacksin",
              "pages",
              "services"
            )
          ),

          getDoc(
            doc(
              db,
              "websites",
              "coolpacksin",
              "pages",
              "contact"
            )
          ),
        ]);


        // ====================================================
        // SERVICES
        // FIREBASE ONLY
        // ====================================================

        if (servicesSnap.exists()) {

          const firebaseServices =
            servicesSnap.data()?.services;

          if (Array.isArray(firebaseServices)) {

            const dynamicServices = firebaseServices
              .map((service, index) => {

                const title =
                  typeof service?.title === "string"
                    ? service.title.trim()
                    : "";

                const desc =
                  typeof service?.desc === "string"
                    ? service.desc.trim()
                    : "";

                return {
                  id:
                    service?.id ||
                    `service-${index}`,

                  title,
                  desc,
                };

              })
              // Only valid admin services
              .filter(
                (service) =>
                  service.title &&
                  service.desc
              );

            if (isMounted) {
              setServices(dynamicServices);
            }

          } else {

            // Firebase document exists but services
            // array is missing/invalid
            if (isMounted) {
              setServices([]);
            }

          }

        } else {

          // No Firebase services document
          if (isMounted) {
            setServices([]);
          }

        }


        // ====================================================
        // CONTACT DATA
        // ====================================================

        if (contactSnap.exists()) {

          const dynamicContact =
            contactSnap.data()?.contactInfo;

          if (isMounted) {

            setContactInfo(
              Array.isArray(dynamicContact)
                ? dynamicContact
                : []
            );

          }

        } else {

          if (isMounted) {
            setContactInfo([]);
          }

        }

      } catch (error) {

        console.error(
          "Error loading services/contact data:",
          error
        );

        // IMPORTANT:
        // No static fallback on error.
        if (isMounted) {
          setServices([]);
          setContactInfo([]);
        }

      } finally {

        if (isMounted) {
          setLoading(false);
        }

      }

    };


    fetchServicesAndContact();


    return () => {
      isMounted = false;
    };

  }, []);


  // ==========================================================
  // DYNAMIC EMERGENCY PHONE
  // ==========================================================

  const emergencyPhone = (() => {

    const item = contactInfo.find((contact) => {

      const label =
        (contact?.label || "").toLowerCase();

      return (
        label.includes("phone") ||
        label.includes("mobile") ||
        label.includes("helpline") ||
        label.includes("emergency") ||
        label.includes("tel") ||
        label.includes("contact")
      );

    });


    if (!item) {
      return "";
    }


    if (Array.isArray(item.value)) {
      return item.value[0] || "";
    }


    return typeof item.value === "string"
      ? item.value.trim()
      : "";

  })();


  // ==========================================================
  // PAGE UI
  // ==========================================================

  return (

    <div className="bg-slate-50 text-slate-900">

      {/* ======================================================
          PAGE BANNER
      ====================================================== */}

      <PageBanner
        badge="Technical Services"
        title="Biomedical Support From Setup to Service"
        subtitle="NABL-certified calibration, 2-hour emergency repair SLAs, cold-chain reagent distribution, and turnkey pathology setup."
      />


      {/* ======================================================
          SERVICES GRID
      ====================================================== */}

      <section className="section-padding bg-gradient-to-b from-white via-slate-50 to-slate-100/60">

        <div className="container-custom">

          <SectionTitle
            badge="Full Service Catalog"
            title="Designed Around Reliable Operations"
            description="Explore our specialized services designed to keep clinical laboratories and hospital departments operating at peak accuracy."
            center
          />


          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

            {/* =================================================
                LOADING STATE
            ================================================= */}

            {loading ? (

              Array.from({ length: 3 }).map((_, index) => (

                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse"
                >

                  <div className="h-14 w-14 rounded-2xl bg-slate-200" />

                  <div className="mt-6 h-6 w-3/4 rounded bg-slate-200" />

                  <div className="mt-4 h-4 w-full rounded bg-slate-200" />

                  <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />

                </div>

              ))

            ) : services.length > 0 ? (

              /* =================================================
                 DYNAMIC SERVICE CARDS
              ================================================= */

              services.map((service, index) => (

                <ServiceCard
                  key={service.id || index}
                  icon={icons[index % icons.length]}
                  title={service.title}
                  description={service.desc}
                />

              ))

            ) : (

              /* =================================================
                 NO SERVICES
                 No static fallback
              ================================================= */

              <div className="col-span-full py-16 text-center">

                <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">

                    <Wrench size={30} />

                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    No Services Available
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-black">
                    Service information is currently unavailable.
                    Please check back later or contact our team.
                  </p>

                  <Link
                    href={makeLink("/contact")}
                    className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-800 px-6 py-3 text-sm font-bold !text-white transition-all hover:bg-slate-700"
                  >
                    Contact Our Team
                  </Link>

                </div>

              </div>

            )}

          </div>

        </div>

      </section>


      {/* ======================================================
          WORKFLOW PROCESS
      ====================================================== */}

      <section className="section-padding bg-white border-y border-slate-200">

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
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-slate-400 hover:shadow-xl hover:shadow-slate-900/5"
                >

                  <div>

                    <div className="flex items-center justify-between">

                      <span className="text-4xl font-black text-slate-300 group-hover:text-slate-800 transition-colors">
                        {step.step}
                      </span>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-800 shadow-sm border border-slate-200">
                        <Icon size={24} />
                      </div>

                    </div>


                    <h3 className="mt-6 text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                      {step.title}
                    </h3>


                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {step.desc}
                    </p>

                  </div>


                  <div className="mt-6 pt-4 border-t border-slate-200">

                    <span className="text-xs font-bold text-slate-800">
                      Phase {index + 1} Milestone
                    </span>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      </section>


      {/* ======================================================
          BREAKDOWN SLA SECTION
      ====================================================== */}

      <section className="section-padding bg-gradient-to-b from-slate-100/50 via-white to-slate-50">

        <div className="container-custom">

          <div className="rounded-3xl border border-slate-700/60 bg-gradient-to-r from-slate-900 to-slate-800 p-8 sm:p-12 text-white shadow-xl">

            <div className="grid lg:grid-cols-12 gap-8 items-center">

              <div className="lg:col-span-8">

                <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700 px-4 py-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">

                  <Zap
                    size={14}
                    className="text-slate-300"
                  />

                  Emergency Breakdown Helpline

                </span>


                <h3 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  Facing an Equipment Emergency in ICU or Lab?
                </h3>


                <p className="mt-3 text-base text-slate-300 leading-relaxed">
                  Our certified field engineers are equipped with OEM diagnostic kits and genuine spare parts for instant on-site restoration.
                </p>


                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm font-semibold text-white">

                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={18}
                      className="text-slate-300"
                    />

                    <span>
                      2-Hour On-Site SLA
                    </span>

                  </div>


                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={18}
                      className="text-slate-300"
                    />

                    <span>
                      Loaner Analyzer Option
                    </span>

                  </div>


                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={18}
                      className="text-slate-300"
                    />

                    <span>
                      NABL Re-calibration Included
                    </span>

                  </div>

                </div>

              </div>


              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-t lg:border-t-0 lg:border-l border-slate-700 pt-6 lg:pt-0 lg:pl-8">

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Emergency Dispatch
                </p>


                {emergencyPhone ? (

                  <a
                    href={`tel:${emergencyPhone.replace(/\s+/g, "")}`}
                    className="mt-2 text-2xl font-black text-white hover:text-slate-300 transition-colors inline-block"
                  >
                    {emergencyPhone}
                  </a>

                ) : (

                  <p className="mt-2 text-sm text-slate-300">
                    24/7 Field Dispatch Active
                  </p>

                )}


                <Link
                  href={makeLink("/contact")}
                  className="mt-5 w-full rounded-2xl bg-slate-700 py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-600 border border-slate-600"
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