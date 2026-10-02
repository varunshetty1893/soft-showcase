import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// Phase 5 Test Isolation: Force the in-memory mock store and strip any real database URLs
// before Vitest workers spawn so tests can never write to a live database.
process.env.USE_MOCK_DB = "true";
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "next/server": path.resolve(__dirname, "node_modules/next/server.js"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    env: {
      USE_MOCK_DB: "true",
      DATABASE_URL: "",
      DIRECT_URL: "",
    },
    server: {
      deps: {
        inline: ["next-auth"],
      },
    },
    coverage: {
      provider: "v8",
    },
  },
});
