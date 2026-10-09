import { defineConfig } from "vitest/config";

// Standalone config on purpose: the app's vite.config.ts wires up the full
// TanStack Start / Nitro build, which the unit tests do not need.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
