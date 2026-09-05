"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import ContactForm from "@/components/ContactForm";
import {
  Mail,
  Phone,
  MapPin,
  Clock3,
  ChevronDown,
  Building,
  Info,
} from "lucide-react";

const faqs = [
  {
    q: "How fast can I get an official price quote for biomedical equipment?",
    a: "Our technical consultants review requirements instantly. You will receive an official quotation with spec sheets within 2 hours during working hours.",
  },
  {
    q: "Do your analyzers come with NABL-traceable calibration certificates?",
    a: "Yes. Every diagnostic system delivered undergoes rigorous calibration and validation tests, accompanied by official NABL-traceable test certificates.",
  },
  {
    q: "What is your emergency breakdown response SLA for hospitals?",
    a: "We maintain a guaranteed 2-hour field engineer dispatch SLA for critical ICU, OT, and pathology laboratory breakdown emergencies.",
  },
  {
    q: "Do you offer annual maintenance contracts (AMC/CMC)?",
    a: "Yes. We offer comprehensive AMC and CMC packages covering routine calibration, preventive maintenance visits, and genuine OEM spare parts replacement.",
  },
  {
    q: "Can we request sample testing or live instrument demonstrations?",
    a: "Absolutely. We arrange live virtual or on-site instrument demonstrations for hospitals and path labs before finalizing procurement.",
  },
];

export default function ContactPage() {
  const [districtData, setDistrictData] = useState(null);
  const [contactInfo, setContactInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);
  const staticRoutes = ["about", "services", "products", "contact", "items"];
  const currentDistrict =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : null;

  useEffect(() => {
    const loadContact = async () => {
      try {
        const snap = await getDoc(
          doc(db, "websites", "clinidixcom", "pages", "contact")
        );
        if (snap.exists()) {
          setContactInfo(snap.data().contactInfo || []);
        }
      } catch (err) {
        console.error("Error loading contact data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadContact();
  }, []);

  useEffect(() => {
    const loadDistrict = async () => {
      if (!currentDistrict) return;
      try {
        const snap = await getDoc(
          doc(db, "websites", "clinidixcom", "districts", currentDistrict)
        );
        if (snap.exists()) {
          setDistrictData(snap.data());
        }
      } catch (err) {
        console.error("Error loading district data:", err);
      }
    };

    loadDistrict();
  }, [currentDistrict]);

  const getFieldIcon = (label = "") => {
    const l = label.toLowerCase();
    if (
      l.includes("phone") ||
      l.includes("mobile") ||
      l.includes("tel") ||
      l.includes("contact")
    ) {
      return <Phone size={26} />;
    }
    if (l.includes("email") || l.includes("mail")) {
      return <Mail size={26} />;
    }
    if (
      l.includes("address") ||
      l.includes("office") ||
      l.includes("location") ||
      l.includes("headquarter")
    ) {
      return <MapPin size={26} />;
    }
    if (
      l.includes("time") ||
      l.includes("hour") ||
      l.includes("clock") ||
      l.includes("schedule")
    ) {
      return <Clock3 size={26} />;
    }
    return <Building size={26} />;
  };

  return (
    <div className="bg-[#FFF9EF]/40 text-[#38240D]">
      {/* Banner */}
      <PageBanner
        badge="Get in Touch"
        title="Talk to a Biomedical Specialist"
        subtitle="Have questions about diagnostic equipment specs, calibration services, or hospital supply tenders? We are here to help 24/7."
      />

      {/* Main Grid */}
      <section className="section-padding bg-gradient-to-b from-white via-[#FFF9EF] to-[#FDFBD4]">
        <div className="container-custom">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Contact Cards - 100% Dynamic from Firestore */}
            <div className="lg:col-span-5 space-y-6">
              <SectionTitle
                badge="Reach Us Directly"
                title="Connect with Our Specialists"
                description="Our dedicated support team and certified field engineers are standing by."
              />

              <div className="space-y-4 mt-8">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-28 rounded-3xl bg-[#F3E4D2]/60 animate-pulse"
                      />
                    ))}
                  </div>
                ) : contactInfo.length === 0 ? (
                  <div className="rounded-3xl border border-[#E8D3BC] bg-white p-8 text-center text-[#5B4634]">
                    <Info size={32} className="mx-auto text-[#C05800] mb-2" />
                    <p className="font-semibold">No Contact Information Added</p>
                    <p className="text-xs mt-1">Please add contact details from the Admin panel.</p>
                  </div>
                ) : (
                  contactInfo.map((item, idx) => {
                    const label = item?.label?.trim() || "Contact Detail";
                    const l = label.toLowerCase();
                    const isPhone =
                      l.includes("phone") ||
                      l.includes("mobile") ||
                      l.includes("tel") ||
                      l.includes("contact");
                    const isEmail = l.includes("email") || l.includes("mail");
                    const isAddress =
                      l.includes("address") ||
                      l.includes("office") ||
                      l.includes("location") ||
                      l.includes("headquarter");

                    let displayValues = [];
                    if (Array.isArray(item?.value)) {
                      displayValues = item.value.filter(
                        (val) => typeof val === "string" && val.trim() !== ""
                      );
                    } else if (
                      typeof item?.value === "string" &&
                      item.value.trim() !== ""
                    ) {
                      displayValues = [item.value.trim()];
                    }

                    // District dynamic replacement for address
                    if (isAddress && districtData) {
                      displayValues = [
                        `${districtData.district}, ${districtData.state}, India`,
                      ];
                    }

                    if (displayValues.length === 0) return null;

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-4 rounded-3xl border border-[#E8D3BC] bg-white p-6 shadow-sm transition-all hover:border-[#C05800]/40 hover:shadow-md"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3E4D2] text-[#C05800] shrink-0">
                          {getFieldIcon(label)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B4634]">
                            {label}
                          </h4>
                          <div className="mt-2 flex flex-col gap-1.5">
                            {displayValues.map((val, vIdx) => {
                              if (isPhone) {
                                return (
                                  <a
                                    key={vIdx}
                                    href={`tel:${String(val).replace(/\s+/g, "")}`}
                                    className="text-base sm:text-lg font-bold text-[#38240D] hover:text-[#C05800] transition-colors inline-block"
                                  >
                                    {val}
                                  </a>
                                );
                              }
                              if (isEmail) {
                                return (
                                  <a
                                    key={vIdx}
                                    href={`mailto:${val}`}
                                    className="text-base font-bold text-[#38240D] hover:text-[#C05800] transition-colors inline-block break-all"
                                  >
                                    {val}
                                  </a>
                                );
                              }
                              return (
                                <p
                                  key={vIdx}
                                  className="text-sm sm:text-base font-bold text-[#38240D] leading-relaxed"
                                >
                                  {val}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="lg:col-span-7">
              <ContactForm
                title="Send Us an Official Inquiry"
                subtitle="Fill out the form below and our equipment specialist will get back to you within 2 hours."
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-white border-t border-[#E8D3BC]/60">
        <div className="container-custom max-w-4xl">
          <SectionTitle
            badge="Frequently Asked Questions"
            title="Got Questions? We Have Answers"
            description="Clear answers regarding our procurement terms, calibration standards, warranties, and emergency repair SLAs."
            center
          />

          <div className="mt-12 space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-[#E8D3BC] bg-[#FFF9EF]/60 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-[#38240D] hover:text-[#C05800]"
                  >
                    <span className="text-base sm:text-lg pr-4">{faq.q}</span>
                    <ChevronDown
                      size={20}
                      className={`shrink-0 text-[#C05800] transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-sm sm:text-base leading-relaxed text-[#5B4634] border-t border-[#E8D3BC]/40 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}