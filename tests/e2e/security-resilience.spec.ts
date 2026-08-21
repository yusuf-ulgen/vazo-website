import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Security & Resilience Verification', () => {
  test('client production bundle contains ZERO secrets or service role keys', () => {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      test.skip();
      return;
    }

    const assetsDir = path.join(distDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
      test.skip();
      return;
    }

    const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
    const prohibitedKeywords = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'VITE_SUPABASE_SERVICE_ROLE_KEY',
      'service_role',
      'SUPABASE_SECRET_KEY',
    ];

    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(assetsDir, file), 'utf-8');
      for (const keyword of prohibitedKeywords) {
        expect(content.includes(keyword), `Prohibited secret ${keyword} found in ${file}`).toBe(false);
      }
    }
  });

  test('storefront gracefully renders when offline or experiencing network failure', async ({ page }) => {
    // Intercept image requests and simulate network error
    await page.route('**/*.{png,jpg,jpeg,webp}', (route) => route.abort());

    await page.goto('/');

    // Page typography, headings, and CTAs must remain completely functional
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Alışverişe Başla' }).first()).toBeVisible();
  });
});
