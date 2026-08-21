import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const auditRoutes = [
  '/',
  '/products',
  '/products/amforik-tas-vazo-tebehir',
  '/wholesale',
  '/wholesale/apply',
  '/about',
  '/contact',
  '/cart',
];

test.describe('Automated Accessibility Audit (Axe-Core & WCAG 2.1 AA)', () => {
  for (const path of auditRoutes) {
    test(`route ${path} has zero critical or serious accessibility violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const seriousOrCritical = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(seriousOrCritical).toEqual([]);
    });
  }

  test('dialogs trap focus and restore focus properly', async ({ page }) => {
    await page.goto('/');

    const searchBtn = page.locator('button[aria-label*="Ürün Ara"]').first();
    await searchBtn.click();

    const searchModal = page.getByRole('dialog', { name: 'Ürün Arama Modalı' });
    await expect(searchModal).toBeVisible();

    // Verify search input is focused
    const searchInput = page.getByLabel('Ürün arama kutusu');
    await expect(searchInput).toBeFocused();

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(searchModal).not.toBeVisible();
  });
});
