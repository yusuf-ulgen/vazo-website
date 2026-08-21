import { test, expect } from '@playwright/test';

test.describe('Product Detail Page (PDP) Flagship E2E Tests', () => {
  test('renders PDP layout with gallery, variant swatches, and accordions', async ({ page }) => {
    await page.goto('/products/amforik-tas-vazo-tebehir');

    await expect(page.locator('h1').first()).toContainText('Amforik Taş Vazo');
    await expect(page.getByText(/₺/).first()).toBeVisible();
    await expect(page.getByText('Stokta Mevcut')).toBeVisible();

    // Default open accordion section
    await expect(page.getByText(/Yüksek derecede \(1250°C\) fırınlanmış/i)).toBeVisible();

    // Toggle Kargo, Paketleme & Sevkiyat Accordion
    const kargoBtn = page.getByRole('button', { name: /Kargo, Paketleme & Sevkiyat/i });
    await kargoBtn.click();
    await expect(page.getByText(/koruyucu ambalajlarla paketlenir/i)).toBeVisible();
  });

  test('adds product to cart and opens cart drawer', async ({ page }) => {
    await page.goto('/products/amforik-tas-vazo-tebehir');

    const addToCartBtn = page.getByRole('button', { name: 'Sepete Ekle' }).first();
    await addToCartBtn.click();

    // Verify button updates to added state
    await expect(page.getByRole('button', { name: /Sepete Eklendi/ })).toBeVisible();

    // Open Cart Drawer from Navbar
    const cartNavBtn = page.getByRole('button', { name: 'Alışveriş Sepeti' }).first();
    await cartNavBtn.click();

    const cartDrawer = page.getByRole('dialog', { name: 'Alışveriş Sepeti Çekmecesi' });
    await expect(cartDrawer).toBeVisible();
    await expect(cartDrawer).toContainText('Amforik Taş Vazo');
  });

  test('opens and closes image zoom modal with Escape', async ({ page }) => {
    await page.goto('/products/amforik-tas-vazo-tebehir');

    const zoomBtn = page.getByRole('button', { name: 'Görseli Büyüt' });
    await zoomBtn.click({ force: true });

    const zoomDialog = page.getByRole('dialog', { name: 'Büyütülmüş Ürün Görseli' });
    await expect(zoomDialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(zoomDialog).not.toBeVisible();
  });
});
