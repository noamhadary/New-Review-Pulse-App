import { type Page, expect } from '@playwright/test';

export const PERF_THRESHOLD_MS = 5_000;

export const TEST_ACCOUNTS = {
  valid: {
    email:    process.env.E2E_USER_EMAIL    ?? 'test@reviewpulse.co.il',
    password: process.env.E2E_USER_PASSWORD ?? 'Test1234!',
  },
  invalid: {
    email:    'invalid-not-an-email',
    password: '123',
  },
  wrongPassword: {
    email:    process.env.E2E_USER_EMAIL ?? 'test@reviewpulse.co.il',
    password: 'WrongPassword999!',
  },
};

export const ROUTES = {
  login:      '/auth/login',
  register:   '/auth/register',
  dashboard:  '/dashboard',
  reviews:    '/reviews',
  analytics:  '/analytics',
  reports:    '/reports',
  onboarding: '/onboarding',
  settings:   '/settings',
};

/** Navigate and assert page loaded within PERF_THRESHOLD_MS. */
export async function gotoTimed(page: Page, url: string) {
  const t0 = Date.now();
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  const elapsed = Date.now() - t0;
  expect(elapsed, `Navigation to ${url} exceeded ${PERF_THRESHOLD_MS}ms (took ${elapsed}ms)`).toBeLessThan(PERF_THRESHOLD_MS);
  return elapsed;
}

/** Click and measure response time. Fails if action takes > threshold. */
export async function clickTimed(page: Page, selector: string, threshold = PERF_THRESHOLD_MS) {
  const t0 = Date.now();
  await page.click(selector);
  const elapsed = Date.now() - t0;
  expect(elapsed, `Click on "${selector}" took ${elapsed}ms (threshold ${threshold}ms)`).toBeLessThan(threshold);
  return elapsed;
}

/** Collect console errors during a callback. Returns array of messages. */
export async function collectConsoleErrors(page: Page, fn: () => Promise<void>) {
  const errors: string[] = [];
  const handler = (msg: import('@playwright/test').ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('console', handler);
  await fn();
  page.off('console', handler);
  return errors;
}

/** Fill every visible text input with an XSS payload and assert it isn't executed. */
export async function xssCheck(page: Page) {
  const payload = '<script>window.__xss=1</script>';
  const inputs = page.locator('input[type="text"], input[type="email"], textarea');
  const count  = await inputs.count();
  for (let i = 0; i < count; i++) {
    const inp = inputs.nth(i);
    if (await inp.isVisible()) {
      await inp.fill(payload);
    }
  }
  const injected = await page.evaluate(() => (window as unknown as Record<string, unknown>)['__xss']);
  expect(injected, 'XSS payload was executed').toBeUndefined();
}

/** Assert a toast/alert message contains text. */
export async function expectToast(page: Page, text: string | RegExp) {
  // react-hot-toast renders inside a div[id="..."] or role="status"
  const toast = page.locator('[role="status"], .go2072408551, div[class*="toast"]').first();
  await expect(toast).toContainText(text, { timeout: 6_000 });
}
