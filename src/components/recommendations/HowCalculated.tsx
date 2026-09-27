import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

import {
  DIMENSION_LABELS,
  type DimensionKey,
  type Recommendation,
} from "../../domain/recommendation";

export function HowCalculated({ rec }: { rec: Recommendation }) {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(DIMENSION_LABELS) as DimensionKey[];

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Info className="h-3.5 w-3.5" />
        How was this calculated?
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-border px-3 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Each area carries normalised 0–100 indicator scores. Your conversation sets a weight per
            dimension; the weights are normalised to sum to 1 and multiplied by the area scores.
          </p>
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                <th className="pb-1 font-normal">Dimension</th>
                <th className="pb-1 text-right font-normal">Score</th>
                <th className="pb-1 text-right font-normal">Weight</th>
                <th className="pb-1 text-right font-normal">Contribution</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {keys.map((k) => (
                <tr key={k} className="border-t border-border/60">
                  <td className="py-1 font-sans">{DIMENSION_LABELS[k]}</td>
                  <td className="py-1 text-right">{rec.scores[k]}</td>
                  <td className="py-1 text-right">{rec.appliedWeights[k].toFixed(2)}</td>
                  <td className="py-1 text-right">{rec.contributions[k].toFixed(1)}</td>
                </tr>
              ))}
              <tr className="border-t border-border">
                <td className="py-1 font-sans font-medium">Personalised score</td>
                <td />
                <td />
                <td className="py-1 text-right font-semibold">{rec.personalizedScore}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Confidence: <span className="font-medium text-foreground">{rec.confidence}</span> —
            based on how many of your budget, commute, household and priority signals were provided.
            Underlying values are seeded demo data standing in for SCB, Skolverket, Brå and
            Trafiklab.
          </p>
        </div>
      ) : null}
    </div>
  );
}
