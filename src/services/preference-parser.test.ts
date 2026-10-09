import { describe, expect, it } from "vitest";

import { emptyProfile } from "../domain/household-profile";
import {
  DEMO_PROMPT,
  applyPatch,
  heuristicParse,
  resolveDestinationKey,
  sanitisePatch,
} from "./preference-parser";

describe("sanitisePatch", () => {
  it("returns an empty patch for non-object input", () => {
    expect(sanitisePatch(null)).toEqual({});
    expect(sanitisePatch("hello")).toEqual({});
    expect(sanitisePatch(42)).toEqual({});
  });

  it("clamps priorities into the 0..1 range and ignores non-numbers", () => {
    const patch = sanitisePatch({ priorities: { safety: 5, schools: -2, commute: "high" } });
    expect(patch.priorities).toEqual({ safety: 1, schools: 0 });
  });

  it("keeps only valid sectors and string municipalities", () => {
    const patch = sanitisePatch({
      sectors: ["north", "mars", "south"],
      municipalities: ["Solna", 7, "Nacka"],
    });
    expect(patch.sectors).toEqual(["north", "south"]);
    expect(patch.municipalities).toEqual(["Solna", "Nacka"]);
  });

  it("limits commute entries to three and falls back to a daily frequency", () => {
    const patch = sanitisePatch({
      commute: [
        { destination: "A", frequency: "sometimes" },
        { destination: "B" },
        { destination: "C" },
        { destination: "D" },
        { nodestination: true },
      ],
    });
    expect(patch.commute).toHaveLength(3);
    expect(patch.commute?.every((c) => c.frequency === "daily")).toBe(true);
  });

  it("truncates very long free-text notes", () => {
    const patch = sanitisePatch({ notes: "x".repeat(1000) });
    expect(patch.notes).toHaveLength(400);
  });
});

describe("applyPatch", () => {
  it("merges a patch without mutating the original profile", () => {
    const base = emptyProfile();
    const next = applyPatch(base, {
      budget: { maxPurchasePrice: 5_000_000 },
      priorities: { safety: 1 },
    });
    expect(next.budget.maxPurchasePrice).toBe(5_000_000);
    expect(next.priorities.safety).toBe(1);
    expect(base.budget.maxPurchasePrice).toBeUndefined();
    expect(base.priorities.safety).toBe(0.5);
  });

  it("clears the sector filter when given an empty list", () => {
    const withSector = applyPatch(emptyProfile(), { sectors: ["north"] });
    const cleared = applyPatch(withSector, { sectors: [] });
    expect(cleared.sectors).toBeUndefined();
  });
});

describe("resolveDestinationKey", () => {
  it("falls back to Stockholm Central for unknown destinations", () => {
    expect(resolveDestinationKey("somewhere unknown")).toBe("stockholmCentral");
  });
});

describe("heuristicParse (offline fallback)", () => {
  it("extracts budget, down payment and child age from the demo prompt", () => {
    const patch = heuristicParse(DEMO_PROMPT);
    expect(patch.budget?.maxPurchasePrice).toBe(6_500_000);
    expect(patch.budget?.downPayment).toBe(500_000);
    expect(patch.household?.childAges).toEqual([6]);
  });

  it("treats safety as a high priority when called extremely important", () => {
    const patch = heuristicParse("Safety is extremely important to us.");
    expect(patch.priorities?.safety).toBe(1);
  });
});
