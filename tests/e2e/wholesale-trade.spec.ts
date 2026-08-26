import { test, expect } from '@playwright/test';

test.describe('Wholesale & Trade Portal E2E Tests', () => {
  test('renders wholesale landing page and navigates to application', async ({ page }) => {
    await page.goto('/wholesale');

    await expect(page.locator('h1').first()).toContainText('Mimari Mekanlara Heykelsi Dokunuş');
    await expect(page.getByText('Ticari İş Ortaklarımız').first()).toBeVisible();

    const applyBtn = page.getByRole('link', { name: /Toptan Satışa Başvur|Ticari Hesap/i }).first();
    await applyBtn.click();

    await expect(page).toHaveURL(/\/wholesale\/apply/);
  });

  test('submits Trade Application with full valid data and sees success confirmation', async ({ page }) => {
    await page.goto('/wholesale/apply');

    await expect(page.locator('h1').first()).toContainText('Toptan Satış & Teklif Talebi');

    await page.getByPlaceholder(/Örn: Arkhe Mimarlık/i).fill('Arkhe Mimarlık & Tasarım Ltd. Şti.');
    await page.getByPlaceholder(/Vergi No/i).fill('1234567890');
    await page.getByPlaceholder(/Vergi Dairesi Adı/i).fill('Beyoğlu Vergi Dairesi');
    await page.getByPlaceholder(/Adınız Soyadınız/i).fill('Mimar Caner Yılmaz');
    await page.getByPlaceholder(/isim@sirketiniz.com/i).fill('caner@arkhemimarlik.com');
    await page.getByPlaceholder(/\+90 5XX/i).fill('05321234567');

    const submitBtn = page.getByRole('button', { name: 'Başvuruyu Tamamla' });
    await submitBtn.click();

    await expect(page.getByText('Başvurunuz Başarıyla Alındı')).toBeVisible();
    await expect(page.getByRole('link', { name: /Toptan Kataloğuna Dön|B2B Kataloğuna Dön/i })).toBeVisible();
  });
});
