import { test, expect } from '@playwright/test';

/**
 * Tests that all authenticated dashboard routes redirect unauthenticated
 * users to /login. This ensures the Supabase middleware is correctly
 * protecting all dashboard pages.
 */
test.describe('Dashboard route protection', () => {
  const protectedRoutes = [
    '/dashboard',
    '/campaigns',
    '/leads',
    '/sequences',
    '/analytics',
    '/settings',
    '/reports',
    '/referrals',
    '/pipeline',
    '/deals',
    '/support',
    '/agency',
    '/white-label',
    '/chat-widget',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
