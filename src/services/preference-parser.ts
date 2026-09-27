import { COMMUTE_DESTINATIONS, type CommuteKey } from "../domain/area";
import { emptyProfile, type HouseholdProfile, type PriorityKey } from "../domain/household-profile";

/* Deterministic, offline fallback parser. It is also used to sanitise and
   merge whatever the language model returns, so the engine never receives
   free-form data. */

export type ProfilePatch = Partial<{
  household: HouseholdProfile["household"];
  budget: HouseholdProfile["budget"];
  commute: HouseholdProfile["commute"];
  priorities: Partial<Record<PriorityKey, number>>;
  sectors: HouseholdProfile["sectors"];
  municipalities: string[];
  notes: string;
}>;

const PRIORITY_KEYS: PriorityKey[] = [
  "safety",
  "schools",
  "commute",
  "affordability",
  "educationLevel",
  "familyFriendliness",
];

export function resolveDestinationKey(destination: string): CommuteKey {
  const d = destination.toLowerCase();
  for (const entry of COMMUTE_DESTINATIONS) {
    if (entry.matches.some((m) => d.includes(m)) || d.includes(entry.label.toLowerCase())) {
      return entry.key;
    }
  }
  return "stockholmCentral";
}

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const isCommuteFrequency = (v: unknown): v is "daily" | "weekly" | "occasional" =>
  v === "daily" || v === "weekly" || v === "occasional";

/** Clamp + shape-check anything coming from the model. */
export function sanitisePatch(input: unknown): ProfilePatch {
  const raw: Record<string, unknown> =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const patch: ProfilePatch = {};

  if (raw["household"] && typeof raw["household"] === "object") {
    const h = raw["household"] as Record<string, unknown>;
    patch.household = {
      adults: num(h["adults"]),
      children: num(h["children"]),
      childAges: Array.isArray(h["childAges"])
        ? h["childAges"].map(num).filter((x): x is number => x !== undefined)
        : undefined,
    };
  }

  if (raw["budget"] && typeof raw["budget"] === "object") {
    const b = raw["budget"] as Record<string, unknown>;
    patch.budget = {
      maxPurchasePrice: num(b["maxPurchasePrice"]),
      downPayment: num(b["downPayment"]),
    };
  }

  if (Array.isArray(raw["commute"])) {
    patch.commute = (raw["commute"] as unknown[])
      .filter(
        (c): c is Record<string, unknown> =>
          !!c &&
          typeof c === "object" &&
          typeof (c as Record<string, unknown>)["destination"] === "string",
      )
      .slice(0, 3)
      .map((c) => ({
        destination: String(c["destination"]).slice(0, 60),
        destinationKey: resolveDestinationKey(String(c["destination"])),
        frequency: isCommuteFrequency(c["frequency"]) ? c["frequency"] : "daily",
        maxMinutes: num(c["maxMinutes"]),
      }));
  }

  if (raw["priorities"] && typeof raw["priorities"] === "object") {
    const rawPriorities = raw["priorities"] as Record<string, unknown>;
    const p: Partial<Record<PriorityKey, number>> = {};
    PRIORITY_KEYS.forEach((k) => {
      const v = num(rawPriorities[k]);
      if (v !== undefined) p[k] = Math.max(0, Math.min(1, v));
    });
    patch.priorities = p;
  }

  if (Array.isArray(raw["sectors"])) {
    patch.sectors = (raw["sectors"] as unknown[]).filter(
      (s): s is "north" | "south" | "east" | "west" | "central" =>
        typeof s === "string" && ["north", "south", "east", "west", "central"].includes(s),
    );
  }
  if (Array.isArray(raw["municipalities"])) {
    patch.municipalities = (raw["municipalities"] as unknown[]).filter(
      (m): m is string => typeof m === "string",
    );
  }
  if (typeof raw["notes"] === "string") patch.notes = raw["notes"].slice(0, 400);

  return patch;
}

export function applyPatch(profile: HouseholdProfile, patch: ProfilePatch): HouseholdProfile {
  const next: HouseholdProfile = {
    ...profile,
    household: { ...profile.household },
    budget: { ...profile.budget },
    commute: [...profile.commute],
    priorities: { ...profile.priorities },
  };

  if (patch.household) {
    Object.entries(patch.household).forEach(([k, v]) => {
      if (v !== undefined) (next.household as Record<string, unknown>)[k] = v;
    });
  }
  if (patch.budget) {
    Object.entries(patch.budget).forEach(([k, v]) => {
      if (v !== undefined) (next.budget as Record<string, unknown>)[k] = v;
    });
  }
  if (patch.commute && patch.commute.length) next.commute = patch.commute;
  if (patch.priorities) {
    Object.entries(patch.priorities).forEach(([k, v]) => {
      if (v !== undefined) next.priorities[k as PriorityKey] = v;
    });
  }
  if (patch.sectors !== undefined) next.sectors = patch.sectors.length ? patch.sectors : undefined;
  if (patch.municipalities !== undefined)
    next.municipalities = patch.municipalities.length ? patch.municipalities : undefined;
  if (patch.notes) next.notes = patch.notes;

  return next;
}

/* ---------------- heuristic parser (offline fallback) ---------------- */

const INTENSIFIERS: Array<[RegExp, number]> = [
  [/(extremely|absolutely|most|top priority|number one|critical|highest)/, 1],
  [/(very|really|super|hugely)/, 0.92],
  [/(quite a lot|quite|important|matters a lot|prioriti)/, 0.8],
  [/(fairly|somewhat|reasonably|nice to have|prefer)/, 0.6],
  [/(not (really|that)|don't (really )?care|doesn't matter|unimportant|less important)/, 0.2],
];

const TOPICS: Array<[PriorityKey, RegExp]> = [
  ["safety", /(safety|safe|crime|secure)/],
  ["schools", /(school|education for|primary school|grundskola|academic)/],
  ["commute", /(commut|travel time|transport|get to work)/],
  ["affordability", /(afford|price|cheap|budget|cost)/],
  [
    "educationLevel",
    /(university[- ]educated|higher education|post[- ]secondary|educated (adults|neighbou?rhood)|academics)/,
  ],
  ["familyFriendliness", /(family|kid|child|children|playground|daughter|son)/],
];

function intensityNear(text: string, index: number): number | undefined {
  const window = text.slice(Math.max(0, index - 90), Math.min(text.length, index + 110));
  for (const [re, v] of INTENSIFIERS) if (re.test(window)) return v;
  return undefined;
}

export function heuristicParse(message: string): ProfilePatch {
  const text = message.toLowerCase();
  const patch: ProfilePatch = { priorities: {} };

  // Budget: "6.5 million", "6 500 000 SEK", "5.5–6.5 million"
  const millions = [
    ...text.matchAll(
      /(\d+(?:[.,]\d+)?)\s*(?:–|-|to)?\s*(\d+(?:[.,]\d+)?)?\s*(?:m|mkr|million|miljoner)/g,
    ),
  ];
  if (millions.length) {
    const first = millions[0]!;
    const hi = parseFloat((first[2] ?? first[1]!).replace(",", "."));
    patch.budget = { maxPurchasePrice: Math.round(hi * 1_000_000) };
  }
  const down = text.match(
    /(\d[\d\s.,]*)\s*(?:sek|kr)?\s*(?:available )?(?:for|as|in)?\s*(?:the )?down[- ]payment/,
  );
  if (down) {
    const v = parseFloat(down[1]!.replace(/[\s,]/g, ""));
    if (Number.isFinite(v)) patch.budget = { ...patch.budget, downPayment: v };
  } else {
    const dp = text.match(/down[- ]payment[^\d]{0,20}(\d[\d\s.,]*)/);
    if (dp) {
      const v = parseFloat(dp[1]!.replace(/[\s,]/g, ""));
      if (Number.isFinite(v)) patch.budget = { ...patch.budget, downPayment: v };
    }
  }

  // Children / ages
  const ages = [...text.matchAll(/(\d{1,2})[- ]year[- ]old/g)]
    .map((m) => parseInt(m[1]!, 10))
    .filter((a) => a <= 19);
  if (ages.length) patch.household = { children: ages.length, childAges: ages };
  else if (/(daughter|son|child|kid)/.test(text)) patch.household = { children: 1 };
  if (/(my (wife|husband|partner|spouse)|we (are|have)|us)/.test(text)) {
    patch.household = { ...patch.household, adults: 2 };
  }

  // Commute destinations
  const commute: HouseholdProfile["commute"] = [];
  for (const dest of COMMUTE_DESTINATIONS) {
    if (dest.matches.some((m) => text.includes(m))) {
      const cap = text.match(
        /(?:no more than|max(?:imum)?|under|less than|within)\s*(\d{1,3})\s*min/,
      );
      commute.push({
        destination: dest.label,
        destinationKey: dest.key,
        frequency: /(every ?weekday|daily|every day)/.test(text) ? "daily" : "weekly",
        maxMinutes: cap ? parseInt(cap[1]!, 10) : undefined,
      });
      break;
    }
  }
  if (commute.length) patch.commute = commute;

  // Priorities
  for (const [key, re] of TOPICS) {
    const m = re.exec(text);
    if (!m) continue;
    const v = intensityNear(text, m.index);
    if (v !== undefined) patch.priorities![key] = v;
    else patch.priorities![key] = 0.7;
  }
  if (/remote/.test(text) && !commute.length) patch.priorities!.commute = 0.3;

  // Geography
  if (/north of stockholm|northern suburbs|up north/.test(text)) patch.sectors = ["north"];
  else if (/south of stockholm|southern suburbs/.test(text)) patch.sectors = ["south"];

  if (patch.priorities && Object.keys(patch.priorities).length === 0) delete patch.priorities;
  return patch;
}

export const DEMO_PROMPT = `I'm 29 and a software engineer with a master's degree. I work remotely. My wife is a product designer and works near Kungsträdgården in central Stockholm and needs to commute there every weekday. We have a 6-year-old daughter who is starting first grade.

We want to buy a home somewhere in or around Stockholm. Safety is extremely important to us. We want an area with very low reported crime, strong primary schools with good academic outcomes, and we prefer neighbourhoods where a high percentage of adults have higher education.

We have approximately 500,000 SEK available for the down payment and can finance a total purchase price of around 5.5–6.5 million SEK.`;

export const startingProfile = emptyProfile;
