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

  test('interacts with Hero dual switcher (Perakende vs Toptan)', async ({ page }) => {
    // Default retail tab
    await expect(page.getByRole('link', { name: 'Alışverişe Başla' }).first()).toBeVisible();
    await expect(page.locator('h1').first()).toContainText('Modern Formlar.');

    // Switch to wholesale tab
    const wholesaleTabBtn = page.getByRole('button', { name: 'Toptan & B2B' }).first();
    await wholesaleTabBtn.click();

    await expect(page.getByRole('link', { name: 'Toptan Kataloğu İncele' }).first()).toBeVisible();
    await expect(page.locator('h1').first()).toContainText('Mimari Projeler &');
  });

  test('submits newsletter subscription form with reactive feedback', async ({ page }) => {
    const emailInput = page.getByLabel('E-posta adresi').first();
    await emailInput.fill('test-e2e-subscriber@example.com');

    const submitBtn = page.getByRole('button', { name: 'Kaydol' }).first();
    await submitBtn.click();

    await expect(page.getByText('Teşekkürler! Stüdyo bültenimize başarıyla kaydoldunuz.')).toBeVisible();
  });

  test('navigates from Category tiles into filtered category catalog', async ({ page }) => {
    const masaUstuCard = page.getByRole('link', { name: /Masa Üstü Vazolar/i }).first();
    await masaUstuCard.click();

    await expect(page).toHaveURL(/\/categories\/masa-ustu-vazolar|\/products\?category=/);
    await expect(page.locator('body')).toContainText('Masa Üstü Vazolar');
  });
});
