/**
 * Auth setup — logs in once and saves session cookies to .auth/user.json.
 * Playwright runs this before any spec in the "chromium" project.
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { TEST_ACCOUNTS, ROUTES } from './helpers';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto(ROUTES.login);
  await page.waitForLoadState('domcontentloaded');

  await page.fill('input[type="email"]', TEST_ACCOUNTS.valid.email);
  await page.fill('input[type="password"]', TEST_ACCOUNTS.valid.password);
  await page.click('button[type="submit"]');

  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15_000 });

  // If redirected to onboarding, skip it by navigating to dashboard
  if (page.url().includes('/onboarding')) {
    // Click through all 4 steps without filling anything
    for (let i = 0; i < 4; i++) {
      const nextBtn = page.locator('button', { hasText: /הבא|עבור ללוח/ }).last();
      if (await nextBtn.isVisible()) {
        const disabled = await nextBtn.isDisabled();
        if (!disabled) await nextBtn.click();
      }
    }
    await page.waitForURL('**/dashboard', { timeout: 10_000 }).catch(() => page.goto('/dashboard'));
  }

  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
