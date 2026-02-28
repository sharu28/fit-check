const { test } = require('playwright/test');

test('capture authenticated video page', async ({ browser }) => {
  const base = 'http://127.0.0.1:3000';
  const email = 'test123@gmail.com';
  const password = 'Test@123';

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/app/video`, { waitUntil: 'domcontentloaded' });

  if (await page.getByText('Welcome back').isVisible()) {
    await page.getByLabel('EMAIL').fill(email);
    await page.getByLabel('PASSWORD').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app\//);
  }

  await page.goto(`${base}/app/video`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'artifacts/screenshots/video-desktop-authenticated.png', fullPage: true });

  const storage = await context.storageState();
  await context.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: storage,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const mobile = await mobileContext.newPage();
  await mobile.goto(`${base}/app/video`, { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(2000);
  await mobile.screenshot({ path: 'artifacts/screenshots/video-mobile-authenticated.png', fullPage: true });
  await mobileContext.close();
});

