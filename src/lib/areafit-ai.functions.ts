import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  message: z.string().min(1).max(4000),
  profile: z.any(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(12)
    .optional(),
});

const SYSTEM = `You are the requirement extractor for Neighborhood Housing Tool, covering the Stockholm region.

Convert the user's natural language into a structured household profile patch and write one short, warm, non-salesy reply (max 45 words) confirming what you understood.

Rules:
- NEVER rank or name specific areas. A deterministic scoring engine does that. Do not promise specific neighbourhoods.
- Never use or infer ethnicity, religion, race, nationality or other protected characteristics. Translate "well-educated area" into the objective indicator "share of adults with post-secondary education" (priorities.educationLevel).
- Speak about crime only as "reported crime statistics".
- priorities are numbers 0..1. "extremely important" = 1, "quite a lot" = 0.8, "don't care" = 0.2. Only include priorities the user actually signalled (directly or clearly implied).
- If the user works remotely, commute matters less for them, but include a spouse's commute if mentioned.
- Budget values in SEK as plain numbers (6.5 million -> 6500000).
- commute[].destination should be a Stockholm place name, e.g. "Kungsträdgården" or "Stockholm Central".
- sectors may contain any of north, south, east, west, central when the user restricts geography.
- This is a follow-up-aware system: only include fields the latest message changes or confirms.

Respond ONLY with JSON:
{"reply":"...","patch":{"household":{"adults":2,"children":1,"childAges":[6]},"budget":{"maxPurchasePrice":6500000,"downPayment":500000},"commute":[{"destination":"Kungsträdgården","frequency":"daily","maxMinutes":40}],"priorities":{"safety":1,"schools":0.9,"commute":0.6,"affordability":0.6,"educationLevel":0.8,"familyFriendliness":0.8},"sectors":["north"],"municipalities":[]}}`;

// Provider-agnostic: point this at any OpenAI-compatible chat-completions
// endpoint (e.g. a free tier from your hosting provider, Groq, OpenRouter,
// Cloudflare Workers AI, etc.) by setting these three env vars. Until they
// are set, this server fn safely no-ops with reason "no_key" — the rest of
// the app (map, scoring, filters) keeps working without it.
const AI_API_KEY = process.env["AI_API_KEY"];
const AI_API_BASE_URL = process.env["AI_API_BASE_URL"]; // e.g. "https://api.groq.com/openai/v1"
const AI_MODEL = process.env["AI_MODEL"]; // e.g. "llama-3.1-8b-instant"

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export const interpretRequest = createServerFn({ method: "POST" })
  .validator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    if (!AI_API_KEY || !AI_API_BASE_URL || !AI_MODEL) {
      return { ok: false as const, reason: "no_key" };
    }

    const messages = [
      { role: "system", content: SYSTEM },
      {
        role: "system",
        content: `Current structured profile (JSON): ${JSON.stringify(data.profile ?? {})}`,
      },
      ...(data.history ?? []),
      { role: "user", content: data.message },
    ];

    try {
      const res = await fetch(`${AI_API_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`AI request failed [${res.status}]: ${body}`);
        return { ok: false as const, reason: res.status === 429 ? "rate_limited" : "error" };
      }

      const json = (await res.json()) as ChatCompletionResponse;
      const content: string = json?.choices?.[0]?.message?.content ?? "";
      const cleaned = content
        .replace(/^```json/i, "")
        .replace(/```$/, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      return {
        ok: true as const,
        reply: typeof parsed.reply === "string" ? parsed.reply : "",
        patch: parsed.patch ?? {},
      };
    } catch (err) {
      console.error("interpretRequest failed", err);
      return { ok: false as const, reason: "error" };
    }
  });
