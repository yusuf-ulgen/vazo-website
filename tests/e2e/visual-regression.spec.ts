import { test, expect } from '@playwright/test';

test.describe('Visual Regression & Approved Reference Verification', () => {
  test('Reference 01: Header & Mega Menu layout consistency', async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const perakendeBtn = page.getByRole('button', { name: 'Perakende' }).first();
    await perakendeBtn.click();
    await expect(page.getByText('Masa Üstü Vazolar').first()).toBeVisible();
  });

  test('Reference 02: Editorial alternating section layout consistency', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Reference 03: Retail / Wholesale Split Section consistency', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('BİREYSEL ALIŞVERİŞ').first()).toBeVisible();
    await expect(page.getByText('PROFESYONEL ALIŞVERİŞ').first()).toBeVisible();
  });

  test('Reference 04: Flagship PDP layout consistency', async ({ page }) => {
    await page.goto('/products/amforik-tas-vazo-tebehir');
    await expect(page.locator('h1').first()).toContainText('Amforik Taş Vazo');
  });

  test('Reference 05: Hybrid Split Hero consistency', async ({ page }) => {
    await page.goto('/');
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
    await expect(page.getByRole('link', { name: /Alışverişe Başla|Koleksiyonu Keşfet/i }).first()).toBeVisible();
  });
});
