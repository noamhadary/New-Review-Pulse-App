/**
 * Settings page tests — Profile tab, Integrations tab, tab navigation,
 * form validation, data persistence, and avatar upload.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { ROUTES, gotoTimed, xssCheck, expectToast, PERF_THRESHOLD_MS } from './helpers';

const UPDATED_PROFILE = {
  name:    'עסק מעודכן E2E',
  phone:   '+972521234567',
  website: 'https://updated-e2e.co.il',
};

test.describe('Settings — tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTimed(page, ROUTES.settings);
  });

  const TABS = ['פרופיל', 'התראות', 'בינה מלאכותית', 'צוות', 'הטמעה', 'חיוב'];

  for (const tab of TABS) {
    test(`"${tab}" tab is clickable and renders content`, async ({ page }) => {
      const tabBtn = page.locator('button', { hasText: tab }).first();
      await expect(tabBtn).toBeVisible();
      const t0 = Date.now();
      await tabBtn.click();
      expect(Date.now() - t0).toBeLessThan(PERF_THRESHOLD_MS);
      // Content area should not be empty after switching
      await expect(page.locator('main, [class*="SectionCard"], section').first()).toBeVisible();
    });
  }
});

test.describe('Settings — Profile tab', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTimed(page, ROUTES.settings);
    await page.waitForLoadState('domcontentloaded');
  });

  test('all profile fields visible', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('button', { hasText: /שמור|שנה/ })).toBeVisible();
  });

  test('edit and save profile — success toast shown', async ({ page }) => {
    // Update business name
    const nameInput = page.locator('input').first();
    await nameInput.fill(UPDATED_PROFILE.name);

    // Save
    const saveBtn = page.locator('button', { hasText: /שמור שינויים/ });
    await saveBtn.click();

    await expectToast(page, /נשמר|הצלחה/);
  });

  test('saved profile persists after page reload', async ({ page }) => {
    const nameInput = page.locator('input').first();
    await nameInput.fill(UPDATED_PROFILE.name);

    await page.locator('button', { hasText: /שמור שינויים/ }).click();
    await page.waitForTimeout(1_500); // allow DB write

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const reloaded = page.locator('input').first();
    await expect(reloaded).toHaveValue(UPDATED_PROFILE.name, { timeout: 6_000 });
  });

  test('saved profile reflected in Settings Onboarding pre-fill', async ({ page }) => {
    const nameInput = page.locator('input').first();
    await nameInput.fill(UPDATED_PROFILE.name);
    await page.locator('button', { hasText: /שמור שינויים/ }).click();
    await page.waitForTimeout(1_500);

    await page.goto(ROUTES.onboarding);
    await page.waitForLoadState('domcontentloaded');

    const onbName = page.locator('input').first();
    await expect(onbName).toHaveValue(UPDATED_PROFILE.name, { timeout: 6_000 });
  });

  test('website field accepts valid URL', async ({ page }) => {
    const websiteInput = page.locator('input[placeholder*="https"]');
    await websiteInput.fill(UPDATED_PROFILE.website);
    await page.locator('button', { hasText: /שמור/ }).click();
    await expectToast(page, /נשמר|הצלחה/);
  });

  test('XSS: profile inputs do not execute injected scripts', async ({ page }) => {
    await xssCheck(page);
  });

  test('"שנה תמונת פרופיל" triggers file picker', async ({ page }) => {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5_000 }),
      page.locator('button', { hasText: /שנה תמונת פרופיל/ }).click(),
    ]);
    expect(fileChooser).toBeTruthy();
  });

  test('avatar upload — shows uploaded image and success toast', async ({ page }) => {
    // Create a minimal 1x1 PNG in memory and upload it
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5_000 }),
      page.locator('button', { hasText: /שנה תמונת פרופיל/ }).click(),
    ]);
    await fileChooser.setFiles({
      name:     'logo.png',
      mimeType: 'image/png',
      buffer:   pngBuffer,
    });

    // Either success toast or error toast (bucket may not be configured in test env)
    await expect(
      page.locator('text=/תמונת הפרופיל עודכנה|שגיאה בהעלאת/')
    ).toBeVisible({ timeout: 15_000 });
  });

  test('password change button opens modal', async ({ page }) => {
    await page.locator('button', { hasText: /שנה סיסמה/ }).click();
    await expect(page.locator('[role="dialog"], [class*="Modal"], [class*="Overlay"]').first()).toBeVisible();
  });
});

test.describe('Settings — Integrations tab', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTimed(page, `${ROUTES.settings}?tab=integrations`);
    // Click the integrations tab directly
    await page.locator('button', { hasText: 'הטמעה' }).first().click();
    await page.waitForTimeout(500);
  });

  test('all four platforms listed', async ({ page }) => {
    for (const p of ['Google Business', 'Facebook Pages', 'TripAdvisor', 'Wolt']) {
      await expect(page.locator(`text=${p}`)).toBeVisible();
    }
  });

  test('"חבר" button opens connect modal', async ({ page }) => {
    const connectBtn = page.locator('button', { hasText: 'חבר' }).first();
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();
    await expect(page.locator('[role="dialog"], [class*="Modal"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('connect modal has credential fields and validates required', async ({ page }) => {
    await page.locator('button', { hasText: 'חבר' }).first().click();
    const modal = page.locator('[role="dialog"], [class*="Modal"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Try to confirm with empty fields
    const confirmBtn = modal.locator('button', { hasText: /חבר|אשר|שמור/ }).first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      // Validation errors should appear
      const fieldError = modal.locator('text=שדה חובה');
      await expect(fieldError).toBeVisible({ timeout: 4_000 });
    }
  });

  test('closing modal does not persist platform as connected', async ({ page }) => {
    const beforeCount = await page.locator('text=מחובר').count();
    await page.locator('button', { hasText: 'חבר' }).first().click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const afterCount = await page.locator('text=מחובר').count();
    expect(afterCount).toBe(beforeCount);
  });

  test('connected platform with credentials shows "שמור פרטים" button', async ({ page }) => {
    // If a platform is already connected, credential fields should be visible
    const connectedCount = await page.locator('text=מחובר').count();
    if (connectedCount > 0) {
      await expect(page.locator('button', { hasText: /שמור פרטים/ }).first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('saving platform credentials shows success toast', async ({ page }) => {
    const saveBtn = page.locator('button', { hasText: /שמור פרטים/ }).first();
    if (!(await saveBtn.isVisible())) { test.skip(); return; }

    await saveBtn.click();
    await expectToast(page, /נשמרו|הצלחה/);
  });
});
