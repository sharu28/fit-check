/**
 * workspace-screenshots.spec.ts
 *
 * Captures desktop + mobile screenshots of every main app surface.
 * Run with:  pnpm pw:snap
 *
 * Output → artifacts/screenshots/
 *   video-desktop.png       video-mobile.png
 *   image-desktop.png       image-mobile.png
 *   templates-desktop.png
 */

import { test, expect, Browser } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'artifacts/screenshots';

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
});

async function newMobileContext(browser: Browser) {
  return browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
}

// ── Video ─────────────────────────────────────────────────────────────────────

test.describe('video', () => {
  test('desktop', async ({ page }) => {
    await page.goto('/app/video', { waitUntil: 'load' });
    await expect(page.getByText(/video quick start/i)).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: path.join(OUT, 'video-desktop.png'), fullPage: true });
  });

  test('mobile', async ({ browser }) => {
    const ctx = await newMobileContext(browser);
    const page = await ctx.newPage();
    await page.goto('/app/video', { waitUntil: 'load' });
    await expect(page.getByText(/video quick start/i)).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: path.join(OUT, 'video-mobile.png'), fullPage: true });
    await ctx.close();
  });
});

// ── Image / Style Studio ──────────────────────────────────────────────────────

test.describe('image', () => {
  test('desktop', async ({ page }) => {
    await page.goto('/app/image', { waitUntil: 'load' });
    // Confirm bypass worked — must not land on auth
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 10_000 });
    // Wait for the empty-state copy in ResultDisplay
    await expect(
      page.getByText(/upload a person and a clothing item/i),
    ).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: path.join(OUT, 'image-desktop.png'), fullPage: true });
  });

  test('mobile', async ({ browser }) => {
    const ctx = await newMobileContext(browser);
    const page = await ctx.newPage();
    await page.goto('/app/image', { waitUntil: 'load' });
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 10_000 });
    await expect(
      page.getByText(/upload a person and a clothing item/i),
    ).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: path.join(OUT, 'image-mobile.png'), fullPage: true });
    await ctx.close();
  });
});

// ── Templates ─────────────────────────────────────────────────────────────────

test.describe('templates', () => {
  test('desktop', async ({ page }) => {
    await page.goto('/app/templates', { waitUntil: 'load' });
    await expect(page.getByText(/template library/i)).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: path.join(OUT, 'templates-desktop.png'), fullPage: true });
  });

  test('mobile', async ({ browser }) => {
    const ctx = await newMobileContext(browser);
    const page = await ctx.newPage();
    await page.goto('/app/templates', { waitUntil: 'load' });
    await expect(page.getByText(/template library/i)).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: path.join(OUT, 'templates-mobile.png'), fullPage: true });
    await ctx.close();
  });
});
