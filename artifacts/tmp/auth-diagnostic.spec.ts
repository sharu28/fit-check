import { test } from '@playwright/test';
import fs from 'node:fs';

test('diagnose auth login state', async ({ page, baseURL }) => {
  const root = baseURL ?? 'http://127.0.0.1:3000';
  fs.mkdirSync('artifacts/screenshots', { recursive: true });

  page.on('console', (msg) => {
    console.log('BROWSER_CONSOLE:', msg.type(), msg.text());
  });

  await page.goto(`${root}/auth`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('test123@gmail.com');
  await page.locator('input[type="password"]').fill('Test@123');
  await page.getByRole('button', { name: /^sign in$/i }).click();

  await page.waitForTimeout(6000);
  const url = page.url();
  console.log('FINAL_URL:', url);

  await page.screenshot({ path: 'artifacts/screenshots/auth-diagnostic.png', fullPage: true });
});
