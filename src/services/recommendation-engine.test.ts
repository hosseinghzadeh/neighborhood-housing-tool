import { describe, expect, it } from "vitest";

import { stockholmDemoRepository } from "../data/providers/stockholm-demo-data";
import { emptyProfile } from "../domain/household-profile";
import { entryPrice, rankAreas } from "./recommendation-engine";

const areas = stockholmDemoRepository.getAreas("greater-stockholm");

describe("rankAreas", () => {
  it("scores every area and sorts best-first", () => {
    const { recommendations, excludedCount } = rankAreas(areas, emptyProfile());
    expect(excludedCount).toBe(0);
    expect(recommendations).toHaveLength(areas.length);
    for (let i = 1; i < recommendations.length; i++) {
      expect(recommendations[i - 1]!.personalizedScore).toBeGreaterThanOrEqual(
        recommendations[i]!.personalizedScore,
      );
    }
  });

  it("keeps every score within 0..100", () => {
    const { recommendations } = rankAreas(areas, emptyProfile());
    for (const r of recommendations) {
      expect(r.personalizedScore).toBeGreaterThanOrEqual(0);
      expect(r.personalizedScore).toBeLessThanOrEqual(100);
    }
  });

  it("is deterministic for the same input", () => {
    const profile = emptyProfile();
    const a = rankAreas(areas, profile).recommendations.map((r) => r.area.id);
    const b = rankAreas(areas, profile).recommendations.map((r) => r.area.id);
    expect(a).toEqual(b);
  });

  it("applies the sector filter and reports how many areas were excluded", () => {
    const profile = { ...emptyProfile(), sectors: ["north" as const] };
    const { recommendations, excludedCount } = rankAreas(areas, profile);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.every((r) => r.area.sector === "north")).toBe(true);
    expect(excludedCount).toBe(areas.length - recommendations.length);
  });

  it("scores affordability higher when the budget is more generous", () => {
    const tight = { ...emptyProfile(), budget: { maxPurchasePrice: 3_000_000 } };
    const generous = { ...emptyProfile(), budget: { maxPurchasePrice: 15_000_000 } };
    const tightScores = rankAreas(areas, tight).recommendations;
    const generousScores = rankAreas(areas, generous).recommendations;
    const avg = (xs: typeof tightScores) =>
      xs.reduce((sum, r) => sum + r.scores.affordability, 0) / xs.length;
    expect(avg(generousScores)).toBeGreaterThan(avg(tightScores));
  });
});

describe("entryPrice", () => {
  const area = { ...areas[0]!, averageApartmentPrice: 5_000_000, averageHousePrice: 4_000_000 };

  it("uses the apartment price for households without children", () => {
    expect(entryPrice(area, emptyProfile())).toBe(5_000_000);
  });

  it("uses the cheaper of apartment and house for households with children", () => {
    const profile = { ...emptyProfile(), household: { children: 1 } };
    expect(entryPrice(area, profile)).toBe(4_000_000);
  });
});
