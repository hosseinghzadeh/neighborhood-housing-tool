import { ArrowLeft, GraduationCap, Home, ShieldAlert, Train, Users } from "lucide-react";

import { formatSek } from "../../domain/household-profile";
import {
  DIMENSION_LABELS,
  TIER_BORDER_COLOR,
  TIER_LABEL,
  matchTier,
  type DimensionKey,
  type Recommendation,
} from "../../domain/recommendation";
import { ScoreBar } from "../recommendations/ScoreBar";
import { HowCalculated } from "../recommendations/HowCalculated";

const ORDER: DimensionKey[] = [
  "safety",
  "schools",
  "education",
  "commute",
  "affordability",
  "family",
];

export function AreaDetails({ rec, onBack }: { rec: Recommendation; onBack: () => void }) {
  const { area } = rec;
  const tier = matchTier(rec.personalizedScore);
  const scoreColor = TIER_BORDER_COLOR[tier];

  return (
    <div className="af-rise space-y-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-[3px] text-[12.5px] text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to matches
      </button>

      {/* Hierarchy: area name → municipality → match score → summary */}
      <header className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <h2 className="font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-text-primary">
            {area.name}
          </h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            {area.municipality} · {area.region}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div
            className="font-mono text-[30px] font-semibold leading-none tabular-nums"
            style={{ color: scoreColor }}
          >
            {rec.personalizedScore}%
          </div>
          <div className="mt-1.5 text-[11.5px] font-medium text-text-secondary">
            {TIER_LABEL[tier]}
          </div>
        </div>
      </header>

      <p className="text-[14px] leading-relaxed text-text-secondary">{area.summary}</p>

      <section>
        <h3 className="wm-label">Why it matches you</h3>
        <ul className="mt-3 space-y-2.5">
          {rec.matches.map((m) => (
            <li key={m} className="flex gap-2.5 text-[13.5px] leading-relaxed">
              <span
                aria-hidden
                className="mt-[0.42rem] h-[5px] w-[5px] shrink-0 rounded-full"
                style={{ background: "var(--positive)" }}
              />
              <span className="text-text-primary">{m}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="wm-label">Trade-offs</h3>
        <ul className="mt-3 space-y-2.5 border-l-2 border-warning/45 pl-3.5">
          {rec.tradeoffs.map((t) => (
            <li key={t} className="text-[13.5px] leading-relaxed text-text-secondary">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="wm-label">Dimension scores</h3>
        <div className="mt-3 space-y-2.5">
          {ORDER.map((k) => (
            <ScoreBar
              key={k}
              label={DIMENSION_LABELS[k]}
              value={rec.scores[k]}
              emphasis={rec.appliedWeights[k] > 0.18}
            />
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-text-muted">
          Bars in ink are the dimensions your conversation weighted most.
        </p>
      </section>

      <section>
        <h3 className="wm-label">Area facts</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
          <Fact icon={<Home className="h-3.5 w-3.5" />} label="Typical apartment">
            {formatSek(area.averageApartmentPrice)}
          </Fact>
          <Fact icon={<Home className="h-3.5 w-3.5" />} label="Typical house">
            {formatSek(area.averageHousePrice)}
          </Fact>
          <Fact icon={<Train className="h-3.5 w-3.5" />} label="To Kungsträdgården">
            {area.commuteTimes.kungstradgarden} min
          </Fact>
          <Fact icon={<Train className="h-3.5 w-3.5" />} label="To Stockholm Central">
            {area.commuteTimes.stockholmCentral} min
          </Fact>
          <Fact icon={<GraduationCap className="h-3.5 w-3.5" />} label="Post-secondary education">
            {area.universityEducatedPercent}% of adults
          </Fact>
          <Fact icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Reported crime index">
            {area.reportedCrimeIndex} / 1 000
          </Fact>
        </dl>
      </section>

      <section>
        <h3 className="wm-label flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Nearby schools
        </h3>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {area.nearbySchools.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13.5px] text-text-primary">
                {s.name}
                <span className="ml-2 text-[12px] text-text-muted">{s.stage}</span>
              </span>
              <span className="shrink-0 font-mono text-[12px] tabular-nums text-text-secondary">
                {s.goalAttainmentPercent}% goal attainment
              </span>
            </li>
          ))}
        </ul>
      </section>

      <HowCalculated rec={rec} />

      <p className="text-[11.5px] leading-relaxed text-text-muted">
        Figures are seeded demo values for demonstration, not official statistics. Crime figures
        describe reported incidents relative to the other compared areas.
      </p>
    </div>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-mono text-[13.5px] tabular-nums text-text-primary">{children}</dd>
    </div>
  );
}
