/**
 * Authenticated navigation — verifies every main page loads, sidebar links work,
 * performance thresholds hold, and console errors are absent.
 */
import { test, expect } from '@playwright/test';
import { ROUTES, gotoTimed, collectConsoleErrors, PERF_THRESHOLD_MS } from './helpers';

const PAGES = [
  { name: 'Dashboard',  route: ROUTES.dashboard  },
  { name: 'Reviews',    route: ROUTES.reviews    },
  { name: 'Analytics',  route: ROUTES.analytics  },
  { name: 'Reports',    route: ROUTES.reports    },
  { name: 'Settings',   route: ROUTES.settings   },
  { name: 'Onboarding', route: ROUTES.onboarding },
];

test.describe('Page load performance', () => {
  for (const { name, route } of PAGES) {
    test(`${name} loads under ${PERF_THRESHOLD_MS}ms`, async ({ page }) => {
      const errors = await collectConsoleErrors(page, async () => {
        const elapsed = await gotoTimed(page, route);
        expect(elapsed, `${name} load time`).toBeLessThan(PERF_THRESHOLD_MS);
      });
      // Network/auth errors from Supabase are acceptable (no real data), code errors are not
      const codeErrors = errors.filter((e) =>
        !e.includes('supabase') &&
        !e.includes('401') &&
        !e.includes('403') &&
        !e.includes('Failed to load resource'),
      );
      expect(codeErrors, `Console errors on ${name}: ${codeErrors.join(' | ')}`).toHaveLength(0);
    });
  }
});

test.describe('Sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    await page.waitForLoadState('domcontentloaded');
  });

  const NAV_ITEMS = [
    { label: 'ביקורות',  expectedPath: '/reviews'    },
    { label: 'ניתוח',    expectedPath: '/analytics'  },
    { label: 'דוחות',    expectedPath: '/reports'    },
    { label: 'הטמעה',    expectedPath: '/onboarding' },
    { label: 'הגדרות',   expectedPath: '/settings'   },
    { label: 'לוח בקרה', expectedPath: '/dashboard'  },
  ];

  for (const { label, expectedPath } of NAV_ITEMS) {
    test(`clicking "${label}" navigates to ${expectedPath}`, async ({ page }) => {
      const t0  = Date.now();
      const btn = page.locator('nav button', { hasText: label }).first();
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForURL(`**${expectedPath}`, { timeout: 8_000 });
      expect(Date.now() - t0).toBeLessThan(PERF_THRESHOLD_MS);
    });
  }
});

test.describe('TopBar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    await page.waitForLoadState('domcontentloaded');
  });

  test('logo click navigates to dashboard', async ({ page }) => {
    await page.goto(ROUTES.settings);
    const logo = page.locator('header img').first();
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('notifications bell opens panel', async ({ page }) => {
    await page.click('button[aria-label="התראות"]');
    await expect(page.locator('text=התראות').last()).toBeVisible();
  });

  test('profile button navigates to settings', async ({ page }) => {
    await page.click('button[aria-label="פרופיל"]');
    await expect(page).toHaveURL(/settings/);
  });
});
