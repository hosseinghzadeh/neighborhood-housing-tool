import "./lib/error-capture";

import { ensureSchema, getDb, isDatabaseHealthy } from "./lib/db.server";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

// Create the saved_searches table on startup. If Postgres is not up yet this
// fails quietly and ensureSchema() retries on the first query that needs it.
if (getDb()) {
  ensureSchema().catch((error: unknown) => {
    console.warn("Database schema not ready yet, will retry on first use:", error);
  });
}

// GET /api/health: 200 only when the database answers. The CI smoke test
// relies on this to prove the app and the Terraform-provisioned database work
// together.
async function healthResponse(): Promise<Response> {
  const healthy = await isDatabaseHealthy();
  return Response.json(
    { status: healthy ? "ok" : "error", database: healthy ? "up" : "down" },
    { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    if (request.method === "GET" && new URL(request.url).pathname === "/api/health") {
      return healthResponse();
    }
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
