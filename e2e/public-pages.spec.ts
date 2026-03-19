import { test, expect } from '@playwright/test';

test.describe('Public pages', () => {
  test('landing page has correct meta title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Captivly/i);
  });

  test('landing page shows pricing section', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toContainText(/pricing/i);
  });

  test('landing page shows feature highlights', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toContainText(/lead/i);
  });

  test('login page has Sign In or Log In heading', async ({ page }) => {
    await page.goto('/login');
    const heading = page.locator('h1, h2');
    await expect(heading.first()).toContainText(/sign in|log in/i);
  });

  test('signup page has Sign Up or Create Account heading', async ({ page }) => {
    await page.goto('/signup');
    const heading = page.locator('h1, h2');
    await expect(heading.first()).toContainText(/sign up|create account/i);
  });
});
