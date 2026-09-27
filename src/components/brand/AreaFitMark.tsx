/**
 * AreaFit brand mark — an understated zigzag glyph, echoing a route
 * between places rather than a pin, roof or key.
 */
export function AreaFitMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path
        d="M4 6.5 L8.4 17.5 L12 10.2 L15.6 17.5 L20 6.5"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function AreaFitLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-[4px] bg-brand text-brand-foreground">
        <AreaFitMark className="h-[18px] w-[18px]" />
      </span>
      <div className="leading-tight">
        <div className="font-display text-[15px] font-semibold tracking-[-0.015em] text-text-primary">
          AreaFit
        </div>
        {compact ? null : (
          <div className="text-[11.5px] text-text-secondary">Find where you should call home.</div>
        )}
      </div>
    </div>
  );
}
