import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:4174",
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://planatrip-test.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-public-key",
      VITE_GOOGLE_MAPS_API_KEY: "",
    },
    timeout: 30000,
  },
});
