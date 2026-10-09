# syntax=docker/dockerfile:1

# ---- build stage ----------------------------------------------------------
FROM node:22-slim AS build

# The project uses Bun for dependency management (bun.lock); Vite itself runs on Node.
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .
# The app targets Cloudflare Workers by default; build a plain Node server for the container.
ENV NITRO_PRESET=node-server
RUN bun run build

# ---- runtime stage --------------------------------------------------------
FROM node:22-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app
# The Nitro output is self-contained: no node_modules needed at runtime.
COPY --from=build /app/.output ./.output

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
