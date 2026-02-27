import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'artifacts/screenshots';

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
});

test('video workspace — desktop', async ({ page }) => {
  await page.goto('/app/video', { waitUntil: 'load' });
  await expect(page.getByText(/video quick start/i)).toBeVisible({ timeout: 20_000 });
  await page.screenshot({
    path: path.join(OUT, 'video-desktop-workspace.png'),
    fullPage: true,
  });
});

test('video workspace — mobile', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto('/app/video', { waitUntil: 'load' });
  await expect(page.getByText(/video quick start/i)).toBeVisible({ timeout: 20_000 });
  await page.screenshot({
    path: path.join(OUT, 'video-mobile-workspace.png'),
    fullPage: true,
  });
  await ctx.close();
});
