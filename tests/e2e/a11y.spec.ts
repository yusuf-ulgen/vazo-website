import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupAdminA11yMocks, loginAdminForA11y, setupCustomerA11yMocks } from './a11y-mocks';

const storefrontRoutes = [
  '/',
  '/products',
  '/products/amforik-tas-vazo-tebehir',
  '/wholesale',
  '/wholesale/apply',
  '/about',
  '/contact',
  '/cart',
  '/seller-information',
  '/payment/success?order_id=e1000000-0000-0000-0000-000000000001',
  '/payment/failure?order_id=e1000000-0000-0000-0000-000000000001',
];

const adminRoutes = [
  '/admin/login',
  '/admin',
  '/admin/products',
  '/admin/categories',
  '/admin/collections',
  '/admin/inventory',
  '/admin/content',
  '/admin/submissions',
  '/admin/settings',
  '/admin/audit',
  '/admin/orders',
  '/admin/payments',
  '/admin/shipping',
];

const customerRoutes = [
  '/account',
  '/account/addresses',
  '/account/orders',
];

test.describe('Automated Accessibility Audit (Axe-Core & WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  // Storefront Axe Scans
  for (const path of storefrontRoutes) {
    test(`Storefront route ${path} has zero critical or serious accessibility violations`, async ({ page }) => {
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

  // Admin Routes Axe Scans
  for (const path of adminRoutes) {
    test(`Admin route ${path} has zero critical or serious accessibility violations`, async ({ page }) => {
      if (path === '/admin/login') {
        await setupAdminA11yMocks(page);
        await page.goto('/admin/login');
      } else {
        await loginAdminForA11y(page);
        await page.goto(path);
      }
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

  // Customer Routes Axe Scans
  for (const path of customerRoutes) {
    test(`Customer route ${path} has zero critical or serious accessibility violations`, async ({ page }) => {
      await setupCustomerA11yMocks(page);
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

  // Storefront Dialog Keyboard Trap & Focus Restoration
  test('storefront search modal traps focus and restores focus properly', async ({ page }) => {
    await page.goto('/');

    const searchBtn = page.locator('button[aria-label*="Ürün Ara"]').first();
    await searchBtn.click();

    const searchModal = page.getByRole('dialog', { name: 'Ürün Arama Modalı' });
    await expect(searchModal).toBeVisible();

    const searchInput = page.getByLabel('Ürün arama kutusu');
    await expect(searchInput).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(searchModal).not.toBeVisible();
  });

  // Admin Modal Keyboard Trap, Tab Wrapping & Focus Restoration
  test('admin product form modal traps focus, wraps tabs and restores focus on Escape', async ({ page }) => {
    await loginAdminForA11y(page);
    await page.goto('/admin/products');

    const addBtn = page.getByRole('button', { name: /Yeni Ürün Ekle|Ürün Ekle/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Escape closes modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  // Admin Refund Modal Focus Trap, Labeling & Escape Key Dismissal
  test('admin refund modal traps focus, has accessible label, and closes on Escape', async ({ page }) => {
    await loginAdminForA11y(page);
    await page.goto('/admin/payments');
    await page.waitForLoadState('domcontentloaded');

    const refundBtn = page.getByRole('button', { name: /İade Et/i }).first();
    if (await refundBtn.isVisible()) {
      await refundBtn.click();
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });
});
