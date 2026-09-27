import { X } from "lucide-react";

import { formatSek } from "../../domain/household-profile";
import type { Recommendation } from "../../domain/recommendation";

type RowDef = {
  label: string;
  value: (r: Recommendation) => number;
  render: (r: Recommendation) => string;
  /** lower value wins */
  lowerIsBetter?: boolean;
};

const ROWS: RowDef[] = [
  { label: "Match", value: (r) => r.personalizedScore, render: (r) => `${r.personalizedScore}%` },
  {
    label: "Typical price",
    value: (r) => Math.min(r.area.averageApartmentPrice, r.area.averageHousePrice),
    render: (r) => formatSek(Math.min(r.area.averageApartmentPrice, r.area.averageHousePrice)),
    lowerIsBetter: true,
  },
  { label: "Safety", value: (r) => r.scores.safety, render: (r) => String(r.scores.safety) },
  { label: "Schools", value: (r) => r.scores.schools, render: (r) => String(r.scores.schools) },
  {
    label: "Education level",
    value: (r) => r.area.universityEducatedPercent,
    render: (r) => `${r.area.universityEducatedPercent}%`,
  },
  {
    label: "Commute",
    value: (r) => r.commuteMinutes ?? r.area.commuteTimes.stockholmCentral,
    render: (r) => `${r.commuteMinutes ?? r.area.commuteTimes.stockholmCentral} min`,
    lowerIsBetter: true,
  },
  {
    label: "Family friendliness",
    value: (r) => r.scores.family,
    render: (r) => String(r.scores.family),
  },
];

export function CompareView({
  recs,
  onClose,
  onRemove,
}: {
  recs: Recommendation[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-ink/25 p-6 backdrop-blur-[2px]">
      <div className="af-rise w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold">Compare areas</h2>
            <p className="text-xs text-muted-foreground">
              Best value per row is highlighted. Demo data.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="overflow-x-auto px-5 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-40 pb-3 text-left text-[10px] font-normal uppercase tracking-[0.08em] text-muted-foreground">
                  Dimension
                </th>
                {recs.map((r) => (
                  <th key={r.area.id} className="pb-3 text-left align-bottom">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold leading-tight">{r.area.name}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {r.area.municipality}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(r.area.id)}
                        aria-label={`Remove ${r.area.name}`}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const values = recs.map(row.value);
                const best = row.lowerIsBetter ? Math.min(...values) : Math.max(...values);
                return (
                  <tr key={row.label} className="border-t border-border">
                    <td className="py-2 text-xs text-muted-foreground">{row.label}</td>
                    {recs.map((r, i) => (
                      <td key={r.area.id} className="py-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs tabular-nums ${
                            values[i] === best
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {row.render(r)}
                          {values[i] === best ? <span className="text-[10px]">best</span> : null}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
