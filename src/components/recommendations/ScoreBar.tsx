export function ScoreBar({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="grid grid-cols-[6.75rem_1fr_1.75rem] items-center gap-3">
      <span
        className={`text-[12.5px] ${emphasis ? "font-medium text-text-primary" : "text-text-secondary"}`}
      >
        {label}
      </span>
      <span className="h-[5px] overflow-hidden rounded-[2px] bg-surface-subtle">
        <span
          className="block h-full rounded-[2px] transition-[width] duration-700 ease-out"
          style={{
            width: `${Math.max(2, value)}%`,
            background: emphasis ? "var(--ink)" : "var(--border-strong)",
          }}
        />
      </span>
      <span
        className={`text-right font-mono text-[12px] tabular-nums ${
          emphasis ? "font-medium text-text-primary" : "text-text-secondary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
