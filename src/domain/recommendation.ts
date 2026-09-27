import type { Area } from "./area";
import type { PriorityKey } from "./household-profile";

export type DimensionKey =
  "safety" | "schools" | "education" | "commute" | "affordability" | "family";

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  safety: "Safety",
  schools: "Schools",
  education: "Education",
  commute: "Commute",
  affordability: "Affordability",
  family: "Family friendly",
};

/** Which priority weight drives which scored dimension */
export const DIMENSION_WEIGHT_KEY: Record<DimensionKey, PriorityKey> = {
  safety: "safety",
  schools: "schools",
  education: "educationLevel",
  commute: "commute",
  affordability: "affordability",
  family: "familyFriendliness",
};

export interface Recommendation {
  area: Area;
  scores: Record<DimensionKey, number>;
  /** Weight actually applied per dimension (normalized to sum 1) */
  appliedWeights: Record<DimensionKey, number>;
  /** Contribution of each dimension to the final score */
  contributions: Record<DimensionKey, number>;
  personalizedScore: number;
  confidence: "high" | "medium" | "low";
  matches: string[];
  tradeoffs: string[];
  commuteMinutes?: number | undefined;
  commuteLabel?: string | undefined;
}

export type MatchTier = "excellent" | "strong" | "possible" | "low";

export const matchTier = (score: number): MatchTier => {
  if (score >= 90) return "excellent";
  if (score >= 80) return "strong";
  if (score >= 70) return "possible";
  return "low";
};

export const TIER_LABEL: Record<MatchTier, string> = {
  excellent: "Excellent match",
  strong: "Strong match",
  possible: "Possible match",
  low: "Low match",
};

export const TIER_COLOR: Record<MatchTier, string> = {
  excellent: "#0f7a5a",
  strong: "#45a06f",
  possible: "#c98a2e",
  low: "#9aa2ae",
};

/** Darker stroke paired with each fill colour */
export const TIER_BORDER_COLOR: Record<MatchTier, string> = {
  excellent: "#0a5c43",
  strong: "#2e7d55",
  possible: "#a26e1f",
  low: "#8b93a0",
};

/** Canonical polygon treatment per match tier */
export const TIER_STYLE: Record<
  MatchTier,
  { fillOpacity: number; weight: number; opacity: number }
> = {
  excellent: { fillOpacity: 0.65, weight: 2.5, opacity: 1 },
  strong: { fillOpacity: 0.5, weight: 2, opacity: 1 },
  possible: { fillOpacity: 0.4, weight: 2, opacity: 0.95 },
  low: { fillOpacity: 0.06, weight: 0.8, opacity: 0.3 },
};

export const TIER_RANGE: Record<MatchTier, string> = {
  excellent: "90–100",
  strong: "80–89",
  possible: "70–79",
  low: "Below 70",
};
