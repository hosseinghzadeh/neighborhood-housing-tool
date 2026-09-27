import { X } from "lucide-react";

import type { HouseholdProfile, PriorityKey } from "../../domain/household-profile";
import { PRIORITY_LABELS, formatSek, weightLabel } from "../../domain/household-profile";

interface Chip {
  id: string;
  label: string;
  value: string;
}

export function buildChips(profile: HouseholdProfile): Chip[] {
  const chips: Chip[] = [];
  const order: PriorityKey[] = [
    "safety",
    "schools",
    "educationLevel",
    "familyFriendliness",
    "affordability",
  ];
  order.forEach((k) => {
    const v = profile.priorities[k];
    if (v >= 0.7 || v <= 0.25) {
      chips.push({ id: k, label: PRIORITY_LABELS[k], value: weightLabel(v) });
    }
  });
  profile.commute.forEach((c) =>
    chips.push({
      id: "commute",
      label: "Commute",
      value: c.maxMinutes ? `${c.destination} ≤ ${c.maxMinutes} min` : c.destination,
    }),
  );
  if (profile.budget.maxPurchasePrice)
    chips.push({
      id: "budget",
      label: "Budget",
      value: `≤ ${formatSek(profile.budget.maxPurchasePrice)}`,
    });
  if (profile.household.childAges?.length)
    chips.push({
      id: "children",
      label: profile.household.childAges.length > 1 ? "Children" : "Child",
      value: profile.household.childAges.map((a) => `age ${a}`).join(", "),
    });
  else if (profile.household.children)
    chips.push({ id: "children", label: "Children", value: String(profile.household.children) });
  if (profile.sectors?.length)
    chips.push({
      id: "sectors",
      label: "Area",
      value: `${profile.sectors.join(", ")} of Stockholm`,
    });
  return chips;
}

export function PreferenceChips({
  profile,
  onRemove,
}: {
  profile: HouseholdProfile;
  onRemove: (id: string) => void;
}) {
  const chips = buildChips(profile);
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={`${chip.id}-${chip.value}`}
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised py-1 pl-2.5 pr-1.5 text-xs text-foreground"
        >
          <span className="font-medium">{chip.label}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{chip.value}</span>
          <button
            type="button"
            aria-label={`Remove ${chip.label} preference`}
            onClick={() => onRemove(chip.id)}
            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
