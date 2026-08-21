import { test, expect } from '@playwright/test';

test.describe('Catalog Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('renders catalog product grid with sorting and category filters', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Tüm Vazo Koleksiyonu');
    const productCards = page.locator('article, .group');
    await expect(productCards.first()).toBeVisible();

    // Filter by Category
    const categoryBtn = page.getByRole('button', { name: 'Masa Üstü Vazolar' });
    await categoryBtn.click();
    await expect(page).toHaveURL(/category=/);

    // Sort by Price Ascending
    const sortSelect = page.getByLabel('Sıralama seçeneği');
    await sortSelect.selectOption('price_asc');
    await expect(page).toHaveURL(/sort=price_asc/);
  });

  test('recovers gracefully from zero results when clearing filters', async ({ page }) => {
    // Navigate with non-matching filter
    await page.goto('/products?material=BilinmeyenMateryalXYZ');

    await expect(page.getByText('Eşleşen Ürün Bulunamadı')).toBeVisible();

    const clearFiltersBtn = page.getByRole('button', { name: 'Filtreleri Temizle' });
    await clearFiltersBtn.click();

    await expect(page.locator('h1').first()).toContainText('Tüm Vazo Koleksiyonu');
    await expect(page.getByText('Eşleşen Ürün Bulunamadı')).not.toBeVisible();
  });
});
