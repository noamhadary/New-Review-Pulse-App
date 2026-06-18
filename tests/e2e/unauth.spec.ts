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
    await page.click('button', { hasText: /דמו/ });
    await expect(page).toHaveURL(/dashboard/, { timeout: 8_000 });
  });

  test('register link navigates to register page', async ({ page }) => {
    await page.click('a', { hasText: /הרשם/ });
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
    // Expect at least email + password + submit + Google + demo
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button', { hasText: /Google/ })).toBeVisible();
  });

  test('shows error on already-registered email', async ({ page }) => {
    await page.fill('input[type="email"]',    TEST_ACCOUNTS.valid.email);
    await page.fill('input[type="password"]', 'NewPass123!');
    await page.click('button[type="submit"]');
    const error = page.locator('[class*="error"], [class*="bg-error"]');
    await expect(error).toBeVisible({ timeout: 8_000 });
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
