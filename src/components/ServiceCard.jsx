import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ServiceCard({
  icon,
  title,
  description,
  badge,
  turnaround,
  highlights = [],
  loading = false,
  makeLink = (p) => p,
}) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl border border-[#E8D3BC] bg-white p-8 shadow-md">
        <div className="mb-6 h-14 w-14 rounded-2xl bg-[#F3E4D2]" />
        <div className="mb-4 h-7 w-3/4 rounded bg-[#EAD9C4]" />
        <div className="space-y-3">
          <div className="h-4 rounded bg-[#F3E4D2]" />
          <div className="h-4 w-11/12 rounded bg-[#F3E4D2]" />
          <div className="h-4 w-8/12 rounded bg-[#F3E4D2]" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-[#E8D3BC] bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-[#C05800]/50 hover:shadow-2xl hover:shadow-[#C05800]/15">
      <div>
        {/* Top bar with Icon & Badge */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3E4D2] to-[#FDFBD4] text-[#C05800] transition-all duration-300 group-hover:bg-[#C05800] group-hover:text-white group-hover:scale-105 shadow-sm">
            {icon}
          </div>

          {badge && (
            <span className="rounded-full border border-[#C05800]/20 bg-[#FDFBD4] px-3 py-1 text-xs font-bold text-[#713600]">
              {badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-3 text-2xl font-bold text-[#38240D] transition-colors duration-300 group-hover:text-[#C05800]">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base leading-relaxed text-[#5B4634]">
          {description}
        </p>

        {/* Highlights List if present */}
        {highlights && highlights.length > 0 && (
          <ul className="mt-6 space-y-2.5 border-t border-[#E8D3BC]/60 pt-5 text-sm text-[#5B4634]">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#C05800] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Link */}
      <div className="mt-8 flex items-center justify-between border-t border-[#E8D3BC]/40 pt-4">
        {turnaround ? (
          <span className="text-xs font-semibold text-[#713600]">
            SLA: <strong className="text-[#C05800]">{turnaround}</strong>
          </span>
        ) : (
          <span className="text-xs font-semibold text-[#5B4634]">Certified Quality</span>
        )}

        <Link
          href={makeLink("/contact")}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#C05800] transition-all group-hover:translate-x-1 group-hover:text-[#713600]"
        >
          <span>Book Service</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}