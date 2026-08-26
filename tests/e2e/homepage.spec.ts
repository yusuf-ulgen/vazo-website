import { test, expect } from '@playwright/test';

test.describe('Homepage E2E User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays Announcement Bar and supports dismissal', async ({ page }) => {
    const announcement = page.locator('aside[aria-label="Duyuru ve Bilgilendirme"]').first();
    await expect(announcement).toBeVisible();

    const dismissBtn = page.getByRole('button', { name: 'Duyuruyu Kapat' });
    await dismissBtn.click();
    await expect(announcement).not.toBeVisible();
  });

  test('renders Split Hero section with Retail and Wholesale channels', async ({ page }) => {
    // Both retail and wholesale CTAs and eyebrows are displayed in split hero
    await expect(page.getByRole('link', { name: /Alışverişe Başla|Koleksiyonu Keşfet/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Toptan Alışverişe Geç|Toptan Kataloğu/i }).first()).toBeVisible();
    await expect(page.getByText('BİREYSEL ALIŞVERİŞ').first()).toBeVisible();
    await expect(page.getByText('PROFESYONEL ALIŞVERİŞ').first()).toBeVisible();
  });

  test('renders Commercial Benefits Reference-03 section', async ({ page }) => {
    await expect(page.getByText('NEDEN VAZO STUDIO?')).toBeVisible();
    await expect(page.getByText('Ticari Avantajlarınız')).toBeVisible();
  });

  test('renders Best Sellers Rail with products and links to catalog', async ({ page, isMobile }) => {
    await expect(page.getByText('Çok Satan Vazo Modelleri')).toBeVisible();
    if (!isMobile) {
      const seeAllBtn = page.getByRole('link', { name: /TÜM ÜRÜNLERİ GÖR/i }).first();
      await seeAllBtn.click();
      await expect(page).toHaveURL(/\/bestsellers|\/products/);
    }
  });
});
