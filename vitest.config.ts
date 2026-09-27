import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

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
