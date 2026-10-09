import { formatSek, type HouseholdProfile } from "../domain/household-profile";

/**
 * One-line label for a saved search, e.g. "2 adults, 1 child · max 6.5M SEK".
 * Pure so it can be unit-tested; used by the saved-searches list.
 */
export function summariseProfile(profile: HouseholdProfile): string {
  const parts: string[] = [];

  const household: string[] = [];
  const { adults, children } = profile.household;
  if (adults) household.push(`${adults} ${adults === 1 ? "adult" : "adults"}`);
  if (children) household.push(`${children} ${children === 1 ? "child" : "children"}`);
  if (household.length) parts.push(household.join(", "));

  const max = profile.budget.maxPurchasePrice;
  if (max) parts.push(`max ${formatSek(max)}`);

  const destinations = profile.commute.map((c) => c.destination).filter(Boolean);
  if (destinations.length) parts.push(`commute to ${destinations.join(", ")}`);

  return parts.length ? parts.join(" · ") : "Default priorities";
}
