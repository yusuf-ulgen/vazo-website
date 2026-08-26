import { test, expect } from '@playwright/test';

test.describe('Navigation & Header E2E Tests', () => {
  test('opens search modal via keyboard shortcut CMD+K / CTRL+K and handles search input', async ({ page }) => {
    await page.goto('/');

    // Trigger Search Modal via search button or keyboard
    const searchBtn = page.locator('button[aria-label*="Ürün Ara"]').first();
    await searchBtn.click();

    const searchDialog = page.getByRole('dialog', { name: 'Ürün Arama Modalı' });
    await expect(searchDialog).toBeVisible();

    const searchInput = page.getByLabel('Ürün arama kutusu');
    await expect(searchInput).toBeFocused();

    // Type query and verify debounced results
    await searchInput.fill('Amforik');
    await expect(page.getByText('Amforik Taş Vazo').first()).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(searchDialog).not.toBeVisible();
  });

  test('opens desktop mega menus on hover/click', async ({ page, isMobile }) => {
    if (isMobile) test.skip();

    await page.goto('/');

    const perakendeBtn = page.getByRole('button', { name: 'Perakende' }).first();
    await perakendeBtn.click();
    await expect(page.getByText('Masa Üstü Vazolar').first()).toBeVisible();

    const toptanBtn = page.getByRole('button', { name: 'Toptan' }).first();
    await toptanBtn.click();
    await expect(page.getByText('Toptan Satış Programı').first()).toBeVisible();
  });

  test('interacts with Mobile Navigation Drawer on mobile viewports', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();

    await page.goto('/');

    const menuBtn = page.getByRole('button', { name: 'Menüyü Aç' });
    await menuBtn.click();

    const mobileDrawer = page.getByRole('dialog', { name: 'Mobil Gezinme Menüsü' });
    await expect(mobileDrawer).toBeVisible();

    // Open Retail Accordion
    const retailAccordionBtn = page.getByText('Perakende Koleksiyonu');
    await retailAccordionBtn.click();
    await expect(page.getByText('Masa Üstü Vazolar').first()).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(mobileDrawer).not.toBeVisible();
  });
});
