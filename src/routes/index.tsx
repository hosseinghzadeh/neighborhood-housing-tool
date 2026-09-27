import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Columns3, RotateCcw } from "lucide-react";

import { BrandLogo } from "../components/brand/BrandMark";
import { Composer } from "../components/chat/Composer";
import { Transcript } from "../components/chat/Transcript";
import { PreferenceChips } from "../components/preferences/PreferenceChips";
import { ResultCard } from "../components/recommendations/ResultCard";
import { AreaDetails } from "../components/area-details/AreaDetails";
import { CompareView } from "../components/comparison/CompareView";
import { StockholmMap } from "../components/map/StockholmMap";
import { REGIONS } from "../data/providers/stockholm-demo-data";
import { DEMO_PROMPT } from "../services/preference-parser";
import { useAreaFit, type RegionId } from "../state/useAreaFit";

const TITLE = "Neighborhood Housing Tool — Find where you should call home";
const DESCRIPTION =
  "Describe your household, budget and priorities. Neighborhood Housing Tool scores neighbourhoods on safety, schools, education level, commute and affordability — and shows why.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

const EXAMPLES = [
  {
    label: "Family of three moving to Stockholm",
    text: DEMO_PROMPT,
  },
  {
    label: "Couple who both commute to the city",
    text: "We're two adults in our thirties, both working in central Stockholm near T-Centralen every weekday. No kids yet. We care most about a short commute and affordability, and we can spend up to 5 million SEK.",
  },
  {
    label: "Space for kids, budget under 7M",
    text: "We have two children aged 4 and 9 and want a house with a garden. Schools and family friendliness matter a lot, safety is very important, and commute doesn't really matter since we both work remotely. Budget around 7 million SEK.",
  },
];

function Index() {
  const af = useAreaFit();
  const [showCompare, setShowCompare] = useState(false);

  const compareRecs = useMemo(
    () => af.result.recommendations.filter((r) => af.compareIds.includes(r.area.id)),
    [af.result.recommendations, af.compareIds],
  );

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-background lg:flex-row">
      {/* ---------------- Left: conversation + recommendations ---------------- */}
      <section className="flex min-h-0 flex-1 flex-col border-border bg-surface lg:h-full lg:w-[40%] lg:min-w-[430px] lg:max-w-[620px] lg:flex-none lg:border-r">
        <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-3.5">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <select
              aria-label="Search area"
              value={af.regionId}
              onChange={(e) => af.setRegionId(e.target.value as RegionId)}
              className="rounded-[4px] border border-border-strong/70 bg-surface-raised px-2 py-1.5 text-[12px] text-text-primary outline-none transition-colors hover:border-border-strong focus:border-ink"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {af.hasProfile ? (
              <button
                type="button"
                onClick={af.reset}
                className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1.5 text-[12px] text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            ) : null}
          </div>
        </header>

        <div className="af-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {!af.hasProfile && !af.messages.length ? (
            <Hero onPick={af.send} />
          ) : (
            <div className="space-y-7">
              <Transcript messages={af.messages} thinking={af.thinking} />

              {af.hasProfile ? (
                af.selected && af.selectedId ? (
                  <AreaDetails rec={af.selected} onBack={() => af.setSelectedId(null)} />
                ) : (
                  <div className="space-y-5">
                    <PreferenceChips profile={af.profile} onRemove={af.removePreference} />

                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="font-display text-[19px] font-semibold tracking-[-0.015em] text-text-primary">
                        Best matches for your household
                      </h2>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-text-muted">
                        {af.result.recommendations.length} areas scored
                      </span>
                    </div>

                    <div className="space-y-3">
                      {af.top.map((rec, i) => (
                        <ResultCard
                          key={rec.area.id}
                          rec={rec}
                          rank={i}
                          active={af.selectedId === rec.area.id}
                          hovered={af.hoveredId === rec.area.id}
                          compareChecked={af.compareIds.includes(rec.area.id)}
                          onSelect={() => af.setSelectedId(rec.area.id)}
                          onHover={af.setHoveredId}
                          onToggleCompare={() => af.toggleCompare(rec.area.id)}
                        />
                      ))}
                      {!af.top.length ? (
                        <p className="border border-dashed border-border px-4 py-6 text-center text-[13.5px] text-text-secondary">
                          No areas match those constraints. Try widening the geography or budget.
                        </p>
                      ) : null}
                    </div>

                    <p className="text-[11.5px] leading-relaxed text-text-muted">
                      Rankings come from a deterministic scoring engine, not from the language
                      model. Values are seeded demo data standing in for SCB, Skolverket, Brå and
                      Trafiklab.
                    </p>
                  </div>
                )
              ) : null}
            </div>
          )}
        </div>

        {af.compareIds.length ? (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-raised px-6 py-2.5">
            <span className="text-[12.5px] text-text-secondary">
              {af.compareIds.length} of 3 selected
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => af.setCompareIds([])}
                className="rounded-[3px] text-[12.5px] text-text-secondary hover:text-text-primary"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowCompare(true)}
                disabled={af.compareIds.length < 2}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-brand px-3 py-1.5 text-[12.5px] font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-35"
              >
                <Columns3 className="h-3.5 w-3.5" /> Compare
              </button>
            </div>
          </div>
        ) : null}

        {af.hasProfile || af.messages.length ? (
          <div className="border-t border-border px-6 py-4">
            <Composer
              onSend={af.send}
              disabled={af.thinking}
              placeholder={'Ask a what-if — "What if our budget was 7 million?"'}
            />
          </div>
        ) : null}
      </section>

      {/* ---------------- Right: map ---------------- */}
      <section className="relative min-h-[45vh] flex-1 lg:h-full lg:min-h-0">
        <StockholmMap
          areas={af.areas}
          recommendations={af.result.recommendations}
          hasProfile={af.hasProfile}
          selectedId={af.selectedId}
          hoveredId={af.hoveredId}
          onSelect={af.setSelectedId}
          onHover={af.setHoveredId}
          onClearSelection={() => af.setSelectedId(null)}
        />
      </section>

      {showCompare && compareRecs.length >= 2 ? (
        <CompareView
          recs={compareRecs}
          onClose={() => setShowCompare(false)}
          onRemove={af.toggleCompare}
        />
      ) : null}
    </main>
  );
}

function Hero({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="af-rise max-w-md">
        <div className="inline-flex items-center gap-1.5 rounded-[3px] border border-border-strong/60 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.09em] text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
          Demo data · Greater Stockholm
        </div>
        <h1 className="mt-6 font-display text-[2.7rem] font-semibold leading-[1.04] tracking-[-0.025em] text-text-primary">
          Find where you should call home.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
          Tell Neighborhood Housing Tool about your household, budget and what matters to you. We
          combine location, housing, education, safety and mobility data to show which areas fit
          your life — and why.
        </p>

        <div className="mt-8">
          <Composer onSend={onPick} disabled={false} large />
        </div>

        <div className="mt-7">
          <p className="wm-label">Try an example</p>
          <div className="mt-2.5 space-y-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => onPick(ex.text)}
                className="block w-full rounded-[4px] border border-border bg-surface-raised px-3.5 py-2.5 text-left text-[13.5px] text-text-primary transition-colors hover:border-border-strong hover:bg-surface-subtle"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-8 text-[11.5px] leading-relaxed text-text-muted">
          Neighborhood Housing Tool is decision support, not an authority. It never uses ethnicity,
          religion or other protected characteristics — "well-educated area" is measured as the
          share of adults with post-secondary education, and crime is described as reported
          statistics.
        </p>
      </div>
    </div>
  );
}
