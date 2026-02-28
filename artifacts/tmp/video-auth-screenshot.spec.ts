import { test } from '@playwright/test';

test('capture authenticated video workspace screenshots', async ({ page, browser }) => {
  const base = 'http://127.0.0.1:3100';
  const email = 'test123@gmail.com';
  const password = 'Test@123';

  await page.goto(`${base}/app/video`, { waitUntil: 'networkidle' });

  if (await page.getByText('Welcome back').isVisible()) {
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.waitForURL(/\/app\//, { timeout: 60000 });
  }

  await page.goto(`${base}/app/video`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'artifacts/screenshots/video-desktop-workspace.png', fullPage: true });

  const state = await page.context().storageState();
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    storageState: state,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${base}/app/video`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: 'artifacts/screenshots/video-mobile-workspace.png', fullPage: true });
  await mobileContext.close();
});
