const { chromium } = require('playwright');

(async () => {
  const base = 'http://127.0.0.1:3000';
  const email = 'test123@gmail.com';
  const password = 'Test@123';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/app/video`, { waitUntil: 'domcontentloaded' });

  const hasAuth = await page.locator('text=Welcome back').count();
  if (hasAuth > 0) {
    await page.getByLabel('EMAIL').fill(email);
    await page.getByLabel('PASSWORD').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app\//, { timeout: 30000 });
  }

  await page.goto(`${base}/app/video`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'artifacts/screenshots/video-desktop-authenticated.png', fullPage: true });

  const storage = await context.storageState();
  await context.close();

  const mContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: storage,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const mPage = await mContext.newPage();
  await mPage.goto(`${base}/app/video`, { waitUntil: 'networkidle' });
  await mPage.waitForTimeout(2000);
  await mPage.screenshot({ path: 'artifacts/screenshots/video-mobile-authenticated.png', fullPage: true });

  await mContext.close();
  await browser.close();
})();
