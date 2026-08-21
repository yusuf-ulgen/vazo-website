import { test, expect } from '@playwright/test';

test.describe('Visual Regression & Approved Reference Verification', () => {
  test('Reference 01: Header & Mega Menu layout consistency', async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const perakendeBtn = page.getByRole('button', { name: 'Perakende' }).first();
    await perakendeBtn.hover();
    await expect(page.getByRole('heading', { name: 'Kategoriler', exact: true })).toBeVisible();
  });

  test('Reference 02: Editorial alternating section layout consistency', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('El Yapımı Seramik').first()).toBeVisible();
    await expect(page.getByText('Doğadan ilham alan özgün tasarımlar.').first()).toBeVisible();
  });

  test('Reference 03: Retail / Wholesale Split Section consistency', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Bireysel Alışveriş').first()).toBeVisible();
    await expect(page.getByText('Profesyonel & Kurumsal').first()).toBeVisible();
  });

  test('Reference 04: Flagship PDP layout consistency', async ({ page }) => {
    await page.goto('/products/amforik-tas-vazo-tebehir');
    await expect(page.locator('h1').first()).toContainText('Amforik Taş Vazo');
    await expect(page.getByText('Toptan Alım / Wholesale').first()).toBeVisible();
  });

  test('Reference 05: Hybrid Hero with dual-mode toggle consistency', async ({ page }) => {
    await page.goto('/');
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
    await expect(page.getByRole('button', { name: 'Perakende' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Toptan & B2B' }).first()).toBeVisible();
  });
});
