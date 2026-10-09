import postgres from "postgres";

// The database is optional: without DATABASE_URL (local `bun dev`, unit tests,
// the default Cloudflare build) the app still works, saved searches are just
// unavailable and /api/health reports 503. Terraform sets it for the container.
const DATABASE_URL = process.env["DATABASE_URL"];

let client: postgres.Sql | undefined;

export function getDb(): postgres.Sql | undefined {
  if (!DATABASE_URL) return undefined;
  client ??= postgres(DATABASE_URL, { max: 5, connect_timeout: 5 });
  return client;
}

let schemaReady: Promise<void> | undefined;

/**
 * Creates the table if it does not exist yet. Memoised, but reset on failure
 * so a later call retries (Postgres may still be starting when the app boots).
 */
export function ensureSchema(): Promise<void> {
  const sql = getDb();
  if (!sql) return Promise.reject(new Error("DATABASE_URL is not set"));

  schemaReady ??= sql`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id serial PRIMARY KEY,
      profile jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `
    .then(() => undefined)
    .catch((error: unknown) => {
      schemaReady = undefined;
      throw error;
    });
  return schemaReady;
}

/** True when a trivial query succeeds. Used by GET /api/health. */
export async function isDatabaseHealthy(): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
