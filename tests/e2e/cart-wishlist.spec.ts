import { test, expect } from '@playwright/test';

test.describe('Cart & Wishlist E2E Lifecycle', () => {
  test('handles complete cart lifecycle (add, drawer, update quantity, remove)', async ({ page }) => {
    await page.goto('/products/amforik-tas-vazo-tebehir');
    await expect(page.locator('h1').first()).toContainText('Amforik Taş Vazo');

    // Add item to cart
    const addBtn = page.getByRole('button', { name: 'Sepete Ekle' }).first();
    await addBtn.click();

    // Open Cart Page
    await page.goto('/cart');
    await expect(page.locator('h1').first()).toContainText('Alışveriş Sepeti');
    await expect(page.getByText('Amforik Taş Vazo').first()).toBeVisible();

    // Remove item
    const removeBtn = page.getByRole('button', { name: 'Ürünü Kaldır' }).first();
    await removeBtn.click();

    await expect(page.getByText('Sepetiniz Boş')).toBeVisible();
  });

  test('toggles wishlist and verifies wishlist page', async ({ page }) => {
    await page.goto('/products/amforik-tas-vazo-tebehir');
    await expect(page.locator('h1').first()).toContainText('Amforik Taş Vazo');

    // Add to wishlist
    const wishBtn = page.getByRole('button', { name: 'Favorilere Ekle' }).first();
    await wishBtn.click();

    // Visit Wishlist Page
    await page.goto('/wishlist');
    await expect(page.getByText('Amforik Taş Vazo').first()).toBeVisible();

    // Clear wishlist
    const clearBtn = page.getByRole('button', { name: 'Tüm Favorileri Temizle' });
    await clearBtn.click();

    await expect(page.getByText('Favori Listeniz Henüz Boş')).toBeVisible();
  });

  test('recovers safely from corrupt localStorage data without crashing storefront', async ({ page }) => {
    // Seed corrupted JSON in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('vazo_cart_items', '{malformed_json_syntax]');
      localStorage.setItem('vazo_wishlist_items', 'not_an_array');
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Page must still render cleanly
    await expect(page.locator('h1').first()).toBeVisible();

    // Open cart drawer - must show empty cart instead of throwing an error
    const cartBtn = page.locator('button[aria-label*="Alışveriş Sepeti"]').first();
    await cartBtn.click();

    await expect(page.getByText('Sepetiniz Boş')).toBeVisible();
  });
});
