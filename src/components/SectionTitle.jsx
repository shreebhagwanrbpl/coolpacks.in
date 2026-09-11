export default function SectionTitle({
  badge,
  title,
  description,
  center = false,
  className = "",
}) {
  return (
    <div
      className={`max-w-3xl ${center ? "mx-auto text-center" : ""} ${className}`}
    >
      {badge && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse" />
          {badge}
        </div>
      )}

      {title && (
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
          {title}
        </h2>
      )}

      {description && (
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
          {description}
        </p>
      )}
    </div>
  );
}