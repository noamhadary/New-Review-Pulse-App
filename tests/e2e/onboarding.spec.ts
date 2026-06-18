/**
 * Onboarding flow tests — step progression, validation, form data persistence.
 */
import { test, expect } from '@playwright/test';
import { ROUTES, gotoTimed, PERF_THRESHOLD_MS } from './helpers';

const BUSINESS = {
  name:     'בדיקה אוטומטית בע"מ',
  phone:    '+972501234567',
  website:  'https://test.co.il',
  category: 'מסעדנות',
};

test.describe('Onboarding steps', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTimed(page, ROUTES.onboarding);
    await page.waitForLoadState('domcontentloaded');
  });

  // ── Step 1: Business details ──

  test('Step 1 — all fields visible and editable', async ({ page }) => {
    await expect(page.locator('text=פרטי העסק')).toBeVisible();

    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill(BUSINESS.name);
    await expect(nameInput).toHaveValue(BUSINESS.name);

    // Category select
    const select = page.locator('select');
    await expect(select).toBeVisible();
    await select.selectOption(BUSINESS.category);
    await expect(select).toHaveValue(BUSINESS.category);
  });

  test('Step 1 → Step 2 navigation works', async ({ page }) => {
    const nextBtn = page.locator('button', { hasText: 'הבא' });
    await expect(nextBtn).toBeEnabled();
    const t0 = Date.now();
    await nextBtn.click();
    expect(Date.now() - t0).toBeLessThan(PERF_THRESHOLD_MS);
    await expect(page.locator('text=חיבור פלטפורמות')).toBeVisible();
  });

  // ── Step 2: Platforms ──

  test('Step 2 — platform cards visible', async ({ page }) => {
    await page.locator('button', { hasText: 'הבא' }).click();
    await expect(page.locator('text=חיבור פלטפורמות')).toBeVisible();

    for (const platform of ['Google Business', 'Facebook Pages', 'TripAdvisor', 'Wolt']) {
      await expect(page.locator(`text=${platform}`)).toBeVisible();
    }
  });

  test('Step 2 — selecting a platform without credentials blocks "הבא"', async ({ page }) => {
    await page.locator('button', { hasText: 'הבא' }).click();
    await expect(page.locator('text=חיבור פלטפורמות')).toBeVisible();

    // Click on Google platform card to select it
    const googleCard = page.locator('text=Google Business').locator('../..');
    await googleCard.click();

    const nextBtn = page.locator('button', { hasText: 'הבא' });
    await expect(nextBtn).toBeDisabled();

    // Warning message should appear
    const warning = page.locator('[class*="yellow"], [class*="warning"], text=נא למלא');
    await expect(warning).toBeVisible();
  });

  test('Step 2 — filling credentials enables "הבא"', async ({ page }) => {
    await page.locator('button', { hasText: 'הבא' }).click();

    // Select Google
    const googleCard = page.locator('text=Google Business').locator('../..');
    await googleCard.click();

    // Fill the Place ID field
    const placeIdInput = page.locator('input[placeholder*="ChIJ"]');
    await expect(placeIdInput).toBeVisible();
    await placeIdInput.fill('ChIJrTLr-GyuEmsRBfy61i59si4');

    // "הבא" should now be enabled
    const nextBtn = page.locator('button', { hasText: 'הבא' });
    await expect(nextBtn).toBeEnabled();
  });

  test('Step 2 — back button returns to Step 1', async ({ page }) => {
    await page.locator('button', { hasText: 'הבא' }).click();
    await page.locator('button', { hasText: 'חזור' }).click();
    await expect(page.locator('text=פרטי העסק')).toBeVisible();
  });

  // ── Step 3: Notifications ──

  test('Step 3 — toggle switches work', async ({ page }) => {
    // Navigate to step 3
    await page.locator('button', { hasText: 'הבא' }).click(); // → step 2
    await page.locator('button', { hasText: 'הבא' }).click(); // → step 3
    await expect(page.locator('text=הגדרות התראות')).toBeVisible();

    const toggles = page.locator('button[role="switch"]');
    const count   = await toggles.count();
    expect(count).toBeGreaterThan(0);

    // Toggle first switch and verify aria-checked flips
    const first      = toggles.first();
    const wasChecked = (await first.getAttribute('aria-checked')) === 'true';
    await first.click();
    const isChecked  = (await first.getAttribute('aria-checked')) === 'true';
    expect(isChecked).toBe(!wasChecked);
  });

  // ── Step 4: Completion ──

  test('Step 4 — summary screen visible', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.locator('button', { hasText: /הבא/ });
      if (await nextBtn.isEnabled()) await nextBtn.click();
    }
    await expect(page.locator('text=פלטפורמות מחוברות')).toBeVisible({ timeout: 6_000 });
  });

  // ── Data persistence ──

  test('Completing onboarding redirects to dashboard', async ({ page }) => {
    // Fill step 1
    const inputs = page.locator('input');
    await (await inputs.all())[0]?.fill(BUSINESS.name);
    await page.locator('select').selectOption(BUSINESS.category);

    // Step 2 — skip platforms
    await page.locator('button', { hasText: 'הבא' }).click();
    await expect(page.locator('text=חיבור פלטפורמות')).toBeVisible();

    // Step 3
    await page.locator('button', { hasText: 'הבא' }).click();
    await expect(page.locator('text=הגדרות התראות')).toBeVisible();

    // Step 4
    await page.locator('button', { hasText: 'הבא' }).click();

    // Complete
    const completeBtn = page.locator('button', { hasText: /עבור ללוח|הושלם/ });
    if (await completeBtn.isVisible()) await completeBtn.click();

    await page.waitForURL(/dashboard/, { timeout: 12_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Business data saved — Settings Profile reflects onboarding values', async ({ page }) => {
    // Fill step 1
    const nameInput = page.locator('input').first();
    await nameInput.fill(BUSINESS.name);
    await page.locator('select').selectOption(BUSINESS.category);

    // Navigate through remaining steps
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.locator('button', { hasText: /הבא|עבור/ });
      if (await nextBtn.isEnabled()) await nextBtn.click();
    }
    await page.waitForURL(/dashboard/, { timeout: 12_000 });

    // Now go to Settings and verify
    await page.goto(ROUTES.settings);
    await page.waitForLoadState('domcontentloaded');

    // Business name field should reflect what was entered
    const nameField = page.locator('input').first();
    const savedName = await nameField.inputValue();
    expect(savedName).toBe(BUSINESS.name);
  });
});
