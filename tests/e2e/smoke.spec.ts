import { test, expect } from '@playwright/test';

const publicRoutes = [
  { path: '/', expectedText: 'Vazo Studio' },
  { path: '/products', expectedText: 'Tüm Vazo Koleksiyonu' },
  { path: '/new', expectedText: 'Yeni Gelenler' },
  { path: '/bestsellers', expectedText: 'Çok Satan Vazo Modelleri' },
  { path: '/categories/masa-ustu-vazolar', expectedText: 'Masa Üstü Vazolar' },
  { path: '/collections', expectedText: 'Koleksiyonlar' },
  { path: '/collections/nordik-sessizlik', expectedText: 'Nordik Sessizlik Serisi' },
  { path: '/products/amforik-tas-vazo-tebehir', expectedText: 'Amforik Taş Vazo' },
  { path: '/wholesale', expectedText: 'Toptan' },
  { path: '/wholesale/products', expectedText: 'Toptan Satışa Uygun Modeller' },
  { path: '/wholesale/how-it-works', expectedText: 'Toptan Sipariş & Üretim Süreci' },
  { path: '/wholesale/apply', expectedText: 'Toptan Satış & Teklif Talebi' },
  { path: '/about', expectedText: 'Hakkımızda' },
  { path: '/contact', expectedText: 'İletişim' },
  { path: '/faq', expectedText: 'Sıkça Sorulan Sorular' },
  { path: '/policies/shipping-returns', expectedText: 'Teslimat & İade' },
  { path: '/policies/privacy-kvkk', expectedText: 'Gizlilik & KVKK' },
  { path: '/policies/terms', expectedText: 'Kullanım Koşulları' },
  { path: '/cart', expectedText: 'Alışveriş Sepeti' },
  { path: '/wishlist', expectedText: 'Favori Listeniz' },
  { path: '/non-existent-wildcard-route', expectedText: '404 — Sayfa Bulunamadı' },
];

test.describe('Storefront Public Route Smoke Tests', () => {
  for (const route of publicRoutes) {
    test(`route ${route.path} loads cleanly without console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
          consoleErrors.push(msg.text());
        }
      });

      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);

      await expect(page.locator('body')).toContainText(route.expectedText, { timeout: 10000 });
      expect(consoleErrors).toEqual([]);
    });
  }
});
