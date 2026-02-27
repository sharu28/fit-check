import { test } from '@playwright/test';

test('diagnose auth submit behavior', async ({ page, baseURL }) => {
  const root = baseURL ?? 'http://127.0.0.1:3000';

  page.on('requestfailed', (req) => {
    console.log('REQ_FAILED:', req.url(), req.failure()?.errorText);
  });
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/auth') || url.includes('supabase')) {
      console.log('RESP:', res.status(), url);
    }
  });

  await page.goto(`${root}/auth`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('test123@gmail.com');
  await page.locator('input[type="password"]').fill('Test@123');
  await page.getByRole('button', { name: /^sign in$/i }).click();

  await page.waitForTimeout(20000);
  console.log('URL_AFTER_20S:', page.url());

  const err = page.locator('.bg-red-50');
  if (await err.count()) {
    console.log('ERROR_TEXT:', await err.first().innerText());
  }
});
