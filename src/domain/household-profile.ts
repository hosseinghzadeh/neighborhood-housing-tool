import type { CommuteKey } from "./area";

export type PriorityKey =
  "safety" | "schools" | "commute" | "affordability" | "educationLevel" | "familyFriendliness";

export interface CommuteRequirement {
  destination: string;
  destinationKey: CommuteKey;
  frequency?: "daily" | "weekly" | "occasional" | undefined;
  maxMinutes?: number | undefined;
}

export interface HouseholdProfile {
  household: {
    adults?: number | undefined;
    children?: number | undefined;
    childAges?: number[] | undefined;
  };
  budget: {
    maxPurchasePrice?: number | undefined;
    downPayment?: number | undefined;
  };
  commute: CommuteRequirement[];
  priorities: Record<PriorityKey, number>;
  /** Optional geographic narrowing, e.g. only north of Stockholm */
  sectors?: Array<"north" | "south" | "east" | "west" | "central"> | undefined;
  municipalities?: string[] | undefined;
  notes?: string | undefined;
}

export const PRIORITY_LABELS: Record<PriorityKey, string> = {
  safety: "Safety",
  schools: "Schools",
  commute: "Commute",
  affordability: "Affordability",
  educationLevel: "Education level",
  familyFriendliness: "Family friendliness",
};

export const emptyProfile = (): HouseholdProfile => ({
  household: {},
  budget: {},
  commute: [],
  priorities: {
    safety: 0.5,
    schools: 0.5,
    commute: 0.5,
    affordability: 0.5,
    educationLevel: 0.4,
    familyFriendliness: 0.5,
  },
});

export const weightLabel = (v: number): string => {
  if (v >= 0.9) return "Very important";
  if (v >= 0.7) return "Important";
  if (v >= 0.45) return "Somewhat important";
  if (v >= 0.25) return "Minor";
  return "Not important";
};

export const formatSek = (v: number): string => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M SEK`;
  if (v >= 1000) return `${Math.round(v / 1000)}k SEK`;
  return `${v} SEK`;
};
