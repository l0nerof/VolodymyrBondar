import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for plain logic (messages, time zones, swarm maths). Browser
// behaviour is covered by the Playwright suite in e2e/.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
