import { Suspense, lazy, useEffect, useState } from "react";

import {
  TIER_COLOR,
  TIER_BORDER_COLOR,
  TIER_RANGE,
  type MatchTier,
} from "../../domain/recommendation";
import type { MapProps } from "./StockholmMapClient";

const MapClient = lazy(() => import("./StockholmMapClient"));

const LEGEND: { tier: MatchTier; label: string }[] = [
  { tier: "excellent", label: "Excellent" },
  { tier: "strong", label: "Strong" },
  { tier: "possible", label: "Possible" },
  { tier: "low", label: "Low" },
];

export function StockholmMap(props: MapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-map-land">
      {mounted ? (
        <Suspense fallback={<MapSkeleton />}>
          <MapClient {...props} />
        </Suspense>
      ) : (
        <MapSkeleton />
      )}

      <div className="pointer-events-none absolute right-4 top-4 z-[500] flex flex-col items-end gap-2">
        <div className="pointer-events-auto rounded-md border border-border-strong/70 bg-surface-raised/95 px-3 py-2.5 shadow-[0_2px_10px_-6px_oklch(0.2_0.02_256/0.4)] backdrop-blur-sm">
          <div className="wm-label">Match strength</div>
          <ul className="mt-2 space-y-1.5">
            {LEGEND.map((l) => (
              <li key={l.tier} className="flex items-center gap-2.5 text-[11.5px] leading-none">
                <span
                  className="h-3 w-3 shrink-0 rounded-[2px]"
                  style={{
                    background: TIER_COLOR[l.tier],
                    opacity: l.tier === "low" ? 0.45 : 0.85,
                    border: `1px solid ${TIER_BORDER_COLOR[l.tier]}`,
                  }}
                />
                <span className="font-mono tabular-nums text-text-secondary">
                  {TIER_RANGE[l.tier]}
                </span>
                <span className="ml-auto pl-3 font-medium text-text-primary">{l.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pointer-events-auto inline-flex w-fit items-center gap-1.5 rounded-[3px] border border-border-strong/60 bg-surface-raised/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.09em] text-text-secondary backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
          Demo data
        </div>
      </div>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-map-land">
      <span className="text-xs text-text-secondary">Loading map…</span>
    </div>
  );
}
