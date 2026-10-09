import { describe, expect, it } from "vitest";

import { emptyProfile } from "../domain/household-profile";
import { summariseProfile } from "./saved-searches";

describe("summariseProfile", () => {
  it("falls back to a generic label for an empty profile", () => {
    expect(summariseProfile(emptyProfile())).toBe("Default priorities");
  });

  it("summarises household, budget and commute", () => {
    const profile = emptyProfile();
    profile.household = { adults: 2, children: 1 };
    profile.budget = { maxPurchasePrice: 6_500_000 };
    profile.commute = [{ destination: "Kungsträdgården", destinationKey: "kungstradgarden" }];

    expect(summariseProfile(profile)).toBe(
      "2 adults, 1 child · max 6.5M SEK · commute to Kungsträdgården",
    );
  });

  it("uses singular and plural correctly", () => {
    const profile = emptyProfile();
    profile.household = { adults: 1, children: 3 };
    expect(summariseProfile(profile)).toBe("1 adult, 3 children");
  });

  it("formats whole-million budgets without a decimal", () => {
    const profile = emptyProfile();
    profile.budget = { maxPurchasePrice: 5_000_000 };
    expect(summariseProfile(profile)).toBe("max 5M SEK");
  });
});
