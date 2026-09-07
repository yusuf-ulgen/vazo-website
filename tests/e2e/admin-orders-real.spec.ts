import { test, expect } from '@playwright/test';

const SUPABASE_LOCAL_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

test.describe('Real Local Supabase Admin Orders Visibility (Zero page.route mocks)', () => {
  let isLocalSupabaseReachable = false;

  test.beforeAll(async () => {
    try {
      const res = await fetch(`${SUPABASE_LOCAL_URL}/auth/v1/health`, {
        headers: { apikey: SUPABASE_ANON_KEY },
      });
      isLocalSupabaseReachable = res.ok || res.status < 500;
    } catch {
      isLocalSupabaseReachable = false;
    }
  });

  test('Real Supabase: Admin orders query matches PostgreSQL schema and loads without route mocks', async ({ page }) => {
    test.skip(
      !isLocalSupabaseReachable,
      'Local Supabase container is not running on 127.0.0.1:54321. Skipping real container browser test.'
    );

    // 1. Perform authentic browser login against live Supabase Auth
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@vazostudio.com');
    await page.fill('input[type="password"]', 'VazoAdmin2026!');
    await page.click('button[type="submit"]');

    // 2. Expect successful dashboard entry
    await expect(page).toHaveURL(/\/admin$/);

    // 3. Navigate to orders page WITHOUT any page.route intercepts
    await page.goto('/admin/orders');
    await expect(page.locator('h1')).toContainText('Sipariş Yönetimi');

    // 4. Verify orders table is loaded from real database
    const ordersTable = page.locator('table');
    await expect(ordersTable).toBeVisible();

    // 5. Verify no generic "mark paid" button exists
    const markPaidBtn = page.getByRole('button', { name: /Ödendi Olarak İşaretle|Mark Paid/i });
    await expect(markPaidBtn).toHaveCount(0);
  });
});
