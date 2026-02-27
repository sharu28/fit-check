import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev --port 3000',
    url: process.env.PW_BASE_URL || 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      ...process.env,
      PW_E2E_AUTH_BYPASS: process.env.PW_E2E_AUTH_BYPASS || '1',
      NEXT_PUBLIC_PW_E2E_AUTH_BYPASS: process.env.NEXT_PUBLIC_PW_E2E_AUTH_BYPASS || '1',
    },
  },
});

