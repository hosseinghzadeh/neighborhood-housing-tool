import { createServerFn } from "@tanstack/react-start";
import type postgres from "postgres";
import { z } from "zod";

import type { HouseholdProfile } from "../domain/household-profile";
import { ensureSchema, getDb } from "./db.server";

export type SavedSearch = {
  id: number;
  profile: HouseholdProfile;
  createdAt: string;
};

const SaveInputSchema = z.object({
  // The profile is produced by the app itself (applyPatch/sanitisePatch), so a
  // shape check is enough here; it is stored as-is in a jsonb column.
  profile: z
    .object({
      household: z.record(z.unknown()),
      budget: z.record(z.unknown()),
      commute: z.array(z.unknown()),
      priorities: z.record(z.number()),
    })
    .passthrough(),
});

export const saveSearch = createServerFn({ method: "POST" })
  .validator((d: unknown) => SaveInputSchema.parse(d))
  .handler(async ({ data }) => {
    const sql = getDb();
    if (!sql) return { ok: false as const, reason: "no_database" };

    await ensureSchema();
    // sql.json() sends a real JSON value; a JSON.stringify'd string would be
    // stored as a jsonb *string* instead of an object.
    await sql`INSERT INTO saved_searches (profile) VALUES (${sql.json(data.profile as postgres.JSONValue)})`;
    return { ok: true as const };
  });

export const listSavedSearches = createServerFn({ method: "GET" }).handler(async () => {
  const sql = getDb();
  if (!sql) return { ok: false as const, reason: "no_database", searches: [] as SavedSearch[] };

  await ensureSchema();
  const rows = await sql<{ id: number; profile: HouseholdProfile; created_at: Date }[]>`
    SELECT id, profile, created_at FROM saved_searches ORDER BY created_at DESC LIMIT 20
  `;
  const searches: SavedSearch[] = rows.map((r) => ({
    id: r.id,
    profile: r.profile,
    createdAt: r.created_at.toISOString(),
  }));
  return { ok: true as const, searches };
});
