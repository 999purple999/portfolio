import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8765',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: process.env.CI
    ? {
        command: 'python3 -m http.server 8765',
        port: 8765,
        timeout: 30_000,
        reuseExistingServer: true,
      }
    : undefined,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
