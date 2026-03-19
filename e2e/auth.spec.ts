import { test, expect } from '@playwright/test';

test.describe('Auth flows', () => {
  test('landing page loads with Captivly branding', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toContainText(/Captivly/i);
  });

  test('login page renders with email and password form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('signup page renders', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test('unauthenticated users get redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated users get redirected from /campaigns to /login', async ({ page }) => {
    await page.goto('/campaigns');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated users get redirected from /leads to /login', async ({ page }) => {
    await page.goto('/leads');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated users get redirected from /settings to /login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});
