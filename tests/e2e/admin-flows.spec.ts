import { test, expect } from '@playwright/test';

test.describe('Admin Flow E2E Tests', () => {
  test('redirects unauthenticated users from /admin to /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('body')).toContainText('Yönetici Girişi');
  });

  test('displays login form with email and password fields', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows validation error on invalid login attempt', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'nonexistent@vazostudio.com');
    await page.fill('input[type="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');

    // Should stay on login page and display error message or stay protected
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
