import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the production build: run `npm run build` first,
// then `npm run test:e2e`. They use the installed Google Chrome, so no
// browser download is needed.
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // The swarm needs WebGL; on a machine without a GPU Chrome only offers it
    // through SwiftShader when asked to.
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "phone", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/ua`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
