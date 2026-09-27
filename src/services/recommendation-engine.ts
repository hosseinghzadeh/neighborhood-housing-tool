import type { Area } from "../domain/area";
import type { HouseholdProfile } from "../domain/household-profile";
import {
  DIMENSION_WEIGHT_KEY,
  type DimensionKey,
  type Recommendation,
} from "../domain/recommendation";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/** Cheapest realistic entry price for the household size. */
export function entryPrice(area: Area, profile: HouseholdProfile): number {
  const children = profile.household.children ?? 0;
  // Households with children are assumed to need at least an apartment;
  // houses are only considered when the apartment stock is pricier.
  return children > 0
    ? Math.min(area.averageApartmentPrice, area.averageHousePrice)
    : area.averageApartmentPrice;
}

function affordabilityScore(area: Area, profile: HouseholdProfile): number {
  const price = entryPrice(area, profile);
  const budget = profile.budget.maxPurchasePrice;
  if (!budget) {
    // No budget stated: score relative to the dataset range (cheaper = better).
    return clamp(100 - ((price - 2_500_000) / 15_000_000) * 100);
  }
  const ratio = price / budget;
  if (ratio <= 0.8) return 100;
  if (ratio <= 1) return clamp(100 - (ratio - 0.8) * 100); // 100 -> 80
  return clamp(80 - (ratio - 1) * 220);
}

export function commuteMinutesFor(area: Area, profile: HouseholdProfile): number | undefined {
  const daily = profile.commute.filter((c) => c.frequency !== "occasional");
  const list = daily.length ? daily : profile.commute;
  if (!list.length) return undefined;
  return Math.max(...list.map((c) => area.commuteTimes[c.destinationKey]));
}

function commuteScore(area: Area, profile: HouseholdProfile): number {
  const minutes = commuteMinutesFor(area, profile);
  if (minutes === undefined) return 70;
  const cap = Math.min(...profile.commute.map((c) => c.maxMinutes ?? Infinity));
  let score = clamp(100 - Math.max(0, minutes - 10) * 2.2);
  if (Number.isFinite(cap) && minutes > cap) score = clamp(score - (minutes - cap) * 4);
  return score;
}

export function dimensionScores(
  area: Area,
  profile: HouseholdProfile,
): Record<DimensionKey, number> {
  return {
    safety: area.safetyScore,
    schools: area.schoolScore,
    education: area.educationScore,
    commute: Math.round(commuteScore(area, profile)),
    affordability: Math.round(affordabilityScore(area, profile)),
    family: area.familyScore,
  };
}

function normalizedWeights(profile: HouseholdProfile): Record<DimensionKey, number> {
  const raw = {} as Record<DimensionKey, number>;
  let sum = 0;
  (Object.keys(DIMENSION_WEIGHT_KEY) as DimensionKey[]).forEach((d) => {
    const w = Math.max(0, profile.priorities[DIMENSION_WEIGHT_KEY[d]] ?? 0);
    raw[d] = w;
    sum += w;
  });
  if (sum === 0) {
    (Object.keys(raw) as DimensionKey[]).forEach((d) => (raw[d] = 1 / 6));
    return raw;
  }
  (Object.keys(raw) as DimensionKey[]).forEach((d) => (raw[d] = raw[d] / sum));
  return raw;
}

function buildNarrative(
  area: Area,
  profile: HouseholdProfile,
  scores: Record<DimensionKey, number>,
  minutes: number | undefined,
  commuteLabel: string | undefined,
): { matches: string[]; tradeoffs: string[] } {
  const matches: string[] = [];
  const tradeoffs: string[] = [];

  if (scores.safety >= 88)
    matches.push(
      `Lower reported crime relative to the compared Stockholm areas (index ${area.reportedCrimeIndex} per 1 000 residents)`,
    );
  else if (scores.safety < 70)
    tradeoffs.push(
      `Higher reported crime than most compared areas (index ${area.reportedCrimeIndex} per 1 000 residents)`,
    );

  if (scores.schools >= 85)
    matches.push(
      `Nearby primary schools report strong goal attainment (${area.nearbySchools[0]?.goalAttainmentPercent ?? "–"}% at ${area.nearbySchools[0]?.name ?? "local school"})`,
    );
  else if (scores.schools < 72)
    tradeoffs.push("Nearby school results are below the compared average");

  if (area.universityEducatedPercent >= 60)
    matches.push(`${area.universityEducatedPercent}% of adults have post-secondary education`);
  else if (area.universityEducatedPercent < 45 && profile.priorities.educationLevel >= 0.6)
    tradeoffs.push(
      `${area.universityEducatedPercent}% of adults have post-secondary education — lower than you indicated as preferable`,
    );

  if (minutes !== undefined && commuteLabel) {
    if (scores.commute >= 75)
      matches.push(`Approximately ${minutes}-minute public transport commute to ${commuteLabel}`);
    else
      tradeoffs.push(
        `Approximately ${minutes} minutes to ${commuteLabel} — longer than several alternatives`,
      );
  }

  const price = entryPrice(area, profile);
  const budget = profile.budget.maxPurchasePrice;
  if (budget && price <= budget)
    matches.push("Housing options potentially within the selected budget");
  else if (budget)
    tradeoffs.push(
      `Typical prices around ${(price / 1_000_000).toFixed(1)}M SEK are above the stated budget`,
    );
  else if (scores.affordability >= 75) matches.push("Comparatively accessible housing prices");
  else tradeoffs.push("Housing prices are relatively high");

  if (scores.family >= 88 && (profile.household.children ?? 0) > 0)
    matches.push("Strong family infrastructure: parks, preschools and low-traffic streets");

  if (!tradeoffs.length)
    tradeoffs.push("Limited housing turnover — availability may be constrained");

  return { matches: matches.slice(0, 6), tradeoffs: tradeoffs.slice(0, 4) };
}

function confidenceOf(profile: HouseholdProfile): Recommendation["confidence"] {
  let signals = 0;
  if (profile.budget.maxPurchasePrice) signals++;
  if (profile.commute.length) signals++;
  if (profile.household.children !== undefined) signals++;
  if (Object.values(profile.priorities).some((v) => v >= 0.8)) signals++;
  return signals >= 3 ? "high" : signals >= 2 ? "medium" : "low";
}

export interface EngineResult {
  recommendations: Recommendation[];
  excludedCount: number;
}

export function rankAreas(areas: Area[], profile: HouseholdProfile): EngineResult {
  const pool = areas.filter((a) => {
    if (profile.sectors?.length && !profile.sectors.includes(a.sector)) return false;
    if (profile.municipalities?.length && !profile.municipalities.includes(a.municipality))
      return false;
    return true;
  });
  const excludedCount = areas.length - pool.length;
  const weights = normalizedWeights(profile);
  const confidence = confidenceOf(profile);

  const recommendations = pool
    .map<Recommendation>((area) => {
      const scores = dimensionScores(area, profile);
      const contributions = {} as Record<DimensionKey, number>;
      let total = 0;
      (Object.keys(scores) as DimensionKey[]).forEach((d) => {
        const c = scores[d] * weights[d];
        contributions[d] = c;
        total += c;
      });
      const minutes = commuteMinutesFor(area, profile);
      const commuteLabel = profile.commute[0]?.destination;
      const { matches, tradeoffs } = buildNarrative(area, profile, scores, minutes, commuteLabel);
      return {
        area,
        scores,
        appliedWeights: weights,
        contributions,
        personalizedScore: Math.round(clamp(total)),
        confidence,
        matches,
        tradeoffs,
        commuteMinutes: minutes,
        commuteLabel,
      };
    })
    .sort((a, b) => b.personalizedScore - a.personalizedScore);

  return { recommendations, excludedCount };
}
