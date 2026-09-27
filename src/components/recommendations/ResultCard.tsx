import { Check, Plus } from "lucide-react";

import { formatSek } from "../../domain/household-profile";
import {
  TIER_BORDER_COLOR,
  TIER_LABEL,
  matchTier,
  type Recommendation,
} from "../../domain/recommendation";

export function ResultCard({
  rec,
  rank,
  active,
  hovered,
  compareChecked,
  onSelect,
  onHover,
  onToggleCompare,
}: {
  rec: Recommendation;
  rank: number;
  active: boolean;
  hovered: boolean;
  compareChecked: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  onToggleCompare: () => void;
}) {
  const tier = matchTier(rec.personalizedScore);
  const price = Math.min(rec.area.averageApartmentPrice, rec.area.averageHousePrice);
  const scoreColor = TIER_BORDER_COLOR[tier];

  return (
    <div
      onMouseEnter={() => onHover(rec.area.id)}
      onMouseLeave={() => onHover(null)}
      className={`af-rise rounded-[4px] border bg-surface-raised transition-colors ${
        active
          ? "border-border-strong bg-surface"
          : hovered
            ? "border-border-strong/80"
            : "border-border"
      }`}
      style={{ animationDelay: `${rank * 40}ms` }}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full rounded-[4px] px-4 py-3.5 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[11px] tabular-nums text-text-muted">
                {String(rank + 1).padStart(2, "0")}
              </span>
              <h3 className="truncate font-display text-[17px] font-semibold leading-tight text-text-primary">
                {rec.area.name}
              </h3>
            </div>
            <p className="mt-1 pl-[1.65rem] text-[12.5px] text-text-secondary">
              {rec.area.municipality}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div
              className="font-mono text-[22px] font-semibold leading-none tabular-nums"
              style={{ color: scoreColor }}
            >
              {rec.personalizedScore}%
            </div>
            <div className="mt-1 text-[11px] font-medium text-text-secondary">
              {TIER_LABEL[tier]}
            </div>
          </div>
        </div>

        <dl className="mt-3.5 grid grid-cols-4 gap-3 border-t border-border pt-3 text-xs">
          <Stat label="From" value={formatSek(price)} />
          <Stat
            label="Commute"
            value={rec.commuteMinutes !== undefined ? `${rec.commuteMinutes} min` : "—"}
          />
          <Stat label="Schools" value={String(rec.scores.schools)} />
          <Stat label="Safety" value={String(rec.scores.safety)} />
        </dl>
      </button>

      <div className="flex items-center justify-end px-3 pb-2">
        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={compareChecked}
          className={`inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[11.5px] transition-colors ${
            compareChecked
              ? "bg-accent font-medium text-text-primary"
              : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
          }`}
        >
          {compareChecked ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {compareChecked ? "Selected to compare" : "Compare"}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-[12.5px] tabular-nums text-text-primary">{value}</dd>
    </div>
  );
}
