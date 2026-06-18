/**
 * Unauthenticated tests — run without stored session.
 * Covers: login page, register page, protected route redirects, auth validation.
 */
import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS, gotoTimed, xssCheck, PERF_THRESHOLD_MS } from './helpers';

// ── Login page ──────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTimed(page, ROUTES.login);
  });

  test('renders all interactive elements', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button', { hasText: /Google/ })).toBeVisible();
    await expect(page.locator('button', { hasText: /דמו/ })).toBeVisible();
    await expect(page.locator('a', { hasText: /הרשם/ })).toBeVisible();
  });

  test('submit button disabled while loading', async ({ page }) => {
    await page.fill('input[type="email"]',    TEST_ACCOUNTS.valid.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.valid.password);
    // Click and immediately check for loading state
    await page.click('button[type="submit"]');
    // Either the button is disabled or contains a spinner
    const btn = page.locator('button[type="submit"]');
    const isLoading = (await btn.isDisabled()) ||
      (await page.locator('.animate-spin').count()) > 0;
    expect(isLoading).toBeTruthy();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.fill('input[type="email"]',    TEST_ACCOUNTS.wrongPassword.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.wrongPassword.password);
    await page.click('button[type="submit"]');
    const error = page.locator('[class*="error"], [class*="bg-error"]');
    await expect(error).toBeVisible({ timeout: 8_000 });
    await expect(error).toContainText(/שגיאה|שגוי|נסה|לא/);
  });

  test('shows HTML5 validation on empty submit', async ({ page }) => {
    await page.click('button[type="submit"]');
    // Browser native required validation prevents submit
    await expect(page).toHaveURL(/login/);
  });

  test('email field rejects invalid format (HTML5)', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_ACCOUNTS.invalid.email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/login/);
  });

  test('demo login navigates to dashboard', async ({ page }) => {
    await page.locator('button', { hasText: /דמו/ }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 8_000 });
  });

  test('register link navigates to register page', async ({ page }) => {
    await page.locator('a', { hasText: /הרשם/ }).click();
    await expect(page).toHaveURL(/register/);
  });

  test('Google button visible and clickable', async ({ page }) => {
    const googleBtn = page.locator('button', { hasText: /Google/ });
    await expect(googleBtn).toBeEnabled();
    // Don't actually trigger OAuth — just assert the button works
  });

  test('XSS: input fields do not execute injected scripts', async ({ page }) => {
    await xssCheck(page);
  });

  test('page loads within performance threshold', async ({ page }) => {
    const elapsed = await gotoTimed(page, ROUTES.login);
    expect(elapsed).toBeLessThan(PERF_THRESHOLD_MS);
  });
});

// ── Register page ────────────────────────────────────────────────────────────

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTimed(page, ROUTES.register);
  });

  test('renders all fields and buttons', async ({ page }) => {
    // Expect at least email + password + submit + Google
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // Register has two password fields (password + confirm) — check first
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button', { hasText: /Google/ })).toBeVisible();
  });

  test('client-side validation blocks submit with short name', async ({ page }) => {
    // Leave name too short (< 2 chars) — validation fires before any network call
    await page.locator('#reg-name').fill('א');
    await page.locator('#reg-business').fill('עסק בדיקה');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.locator('#reg-password').fill('TestPass123!');
    await page.locator('#reg-confirm').fill('TestPass123!');
    await page.click('button[type="submit"]');
    // App shows a field-level warning banner
    const warning = page.locator('[style*="warning"], [style*="fff3cd"]').or(
      page.locator('text=לפחות 2 תווים'),
    );
    await expect(warning).toBeVisible({ timeout: 5_000 });
    // Still on register page — no navigation
    await expect(page).toHaveURL(/register/);
  });

  test('password mismatch shows inline error', async ({ page }) => {
    await page.locator('#reg-password').fill('Password123!');
    await page.locator('#reg-confirm').fill('DifferentPass!');
    await expect(page.locator('text=הסיסמאות אינן תואמות')).toBeVisible({ timeout: 4_000 });
  });

  test('login link navigates to login page', async ({ page }) => {
    const loginLink = page.locator('a', { hasText: /התחבר|כניסה/ });
    await loginLink.click();
    await expect(page).toHaveURL(/login/);
  });

  test('XSS: input fields do not execute scripts', async ({ page }) => {
    await xssCheck(page);
  });
});

// ── Protected route redirects ────────────────────────────────────────────────

test.describe('Protected routes redirect unauthenticated users', () => {
  const protectedRoutes = [
    ROUTES.dashboard,
    ROUTES.reviews,
    ROUTES.analytics,
    ROUTES.reports,
    ROUTES.onboarding,
    ROUTES.settings,
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to login`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL((url) => url.pathname.includes('/auth/login'), { timeout: 8_000 });
      await expect(page).toHaveURL(/login/);
    });
  }
});
