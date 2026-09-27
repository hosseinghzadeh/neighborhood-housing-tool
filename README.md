# AreaFit

A neighbourhood-matching housing tool. Describe your household, budget and
priorities in plain language, and AreaFit scores neighbourhoods on safety,
schools, education level, commute and affordability — showing which areas
fit your life, and why.

Built with:

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Development

Requires Node.js 18.17+ (or 20.5+) and [bun](https://bun.sh).

```sh
bun install
bun dev
```

If you prefer npm, `npm install` / `npm run dev` also work.

## AI-assisted input (optional)

The natural-language request box (`src/lib/areafit-ai.functions.ts`) calls
an OpenAI-compatible chat-completions endpoint to turn free text into a
structured household profile. It is optional — without it, the rest of the
app (map, scoring, filters) still works, only the free-text box is disabled.

To enable it, set these environment variables to any OpenAI-compatible
provider (e.g. a free tier from your hosting provider, Groq, OpenRouter,
Cloudflare Workers AI, etc.):

```
AI_API_KEY=...
AI_API_BASE_URL=https://api.example.com/v1
AI_MODEL=some-model-name
```

## Notes

- `@lovable.dev/vite-tanstack-config` in `package.json` is a public build-tool
  dependency (it wraps TanStack Start's Vite config) — the project was
  originally scaffolded with [Lovable](https://lovable.dev), but no longer
  syncs with it and has no other Lovable-specific dependency or service call.
- Map and neighbourhood data (`src/data/`) is seeded demo data for the
  Stockholm region, not live statistics.
