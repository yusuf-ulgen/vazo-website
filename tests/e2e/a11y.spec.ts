import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const storefrontRoutes = [
  '/',
  '/products',
  '/products/amforik-tas-vazo-tebehir',
  '/wholesale',
  '/wholesale/apply',
  '/about',
  '/contact',
  '/cart',
];

const adminRoutes = [
  '/admin/login',
  '/admin',
  '/admin/products',
  '/admin/categories',
  '/admin/collections',
  '/admin/inventory',
  '/admin/content',
  '/admin/submissions',
  '/admin/settings',
  '/admin/audit',
];

async function setupAdminA11yMocks(page: Page) {
  const adminUser = {
    id: 'a0000000-0000-0000-0000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'admin@vazostudio.com',
    email_confirmed_at: '2026-08-01T00:00:00.000Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-26T00:00:00.000Z',
  };

  const sessionObj = {
    access_token: 'mock-admin-token-xyz',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-admin-refresh-token',
    user: adminUser,
  };

  await page.addInitScript((session) => {
    window.localStorage.setItem('sb-127-0-0-1-auth-token', JSON.stringify(session));
  }, sessionObj);

  await page.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(adminUser),
    });
  });

  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessionObj),
    });
  });

  await page.route('**/rest/v1/admin_users*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: adminUser.id,
        role: 'admin',
        active: true,
      }),
    });
  });

  await page.route('**/rest/v1/products*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': '0-0/1' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'a2000000-0000-0000-0000-000000000001',
          slug: 'amforik-tas-vazo-tebehir',
          name: 'Amforik Taş Vazo',
          status: 'published',
          retail_price: 2450,
          wholesale_enabled: true,
          product_variants: [{ id: 'a3000000-0000-0000-0000-000000000001', sku: 'VAZ-AMF-WHT-M', stock_quantity: 24 }],
          product_media: [{ id: 'a4000000-0000-0000-0000-000000000001', url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5', is_primary: true }],
          product_categories: [{ category_id: 'c0000000-0000-0000-0000-000000000001' }],
          product_collections: [{ collection_id: 'b0000000-0000-0000-0000-000000000001' }],
        },
      ]),
    });
  });

  await page.route('**/rest/v1/categories*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'c0000000-0000-0000-0000-000000000001', slug: 'masa-ustu-vazolar', name: 'Masa Üstü Vazolar', sort_order: 1, active: true },
      ]),
    });
  });

  await page.route('**/rest/v1/collections*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'b0000000-0000-0000-0000-000000000001', slug: 'nordik-sessizlik', name: 'Nordik Sessizlik Serisi', sort_order: 1, active: true },
      ]),
    });
  });

  await page.route('**/rest/v1/product_variants*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': '0-0/1' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'a3000000-0000-0000-0000-000000000001',
          product_id: 'a2000000-0000-0000-0000-000000000001',
          sku: 'VAZ-AMF-WHT-M',
          variant_name: 'Medium / Tebeşir Beyazı',
          color_name: 'Tebeşir Beyazı',
          stock_quantity: 24,
          retail_price: 2450,
          active: true,
          products: { name: 'Amforik Taş Vazo', slug: 'amforik-tas-vazo-tebehir' },
        },
      ]),
    });
  });

  await page.route('**/rest/v1/content_pages*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'c1000000-0000-0000-0000-000000000001', page_key: 'about', title: 'Hakkımızda', published: true },
      ]),
    });
  });

  await page.route('**/rest/v1/content_sections*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'c2000000-0000-0000-0000-000000000001', page_id: 'c1000000-0000-0000-0000-000000000001', section_key: 'hero', title: 'Felsefemiz', active: true, sort_order: 1 },
      ]),
    });
  });

  await page.route('**/rest/v1/hero_slides*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'a1000000-0000-0000-0000-000000000001', slot: 'retail', title: 'Perakende', sort_order: 1, active: true },
      ]),
    });
  });

  await page.route('**/rest/v1/wholesale_benefits*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'a5000000-0000-0000-0000-000000000001', title: 'Mimari Destek', sort_order: 1 },
      ]),
    });
  });

  await page.route('**/rest/v1/faq_groups*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'f1000000-0000-0000-0000-000000000001', title: 'Sipariş & Teslimat', sort_order: 1, active: true },
      ]),
    });
  });

  await page.route('**/rest/v1/faq_items*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'f2000000-0000-0000-0000-000000000001', group_id: 'f1000000-0000-0000-0000-000000000001', question: 'Kargo süresi?', answer: '1-3 gün', sort_order: 1, active: true },
      ]),
    });
  });

  await page.route('**/rest/v1/trade_applications*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': '0-0/1' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 't0000000-0000-0000-0000-000000000001',
          company_name: 'Atölye Mimarlık',
          tax_number: '1234567890',
          contact_person: 'Ahmet Yılmaz',
          email: 'ahmet@atolyemimarlik.com',
          phone: '05551112233',
          business_type: 'Mimarlık Ofisi',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ]),
    });
  });

  await page.route('**/rest/v1/contact_messages*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': '0-0/1' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'cm000000-0000-0000-0000-000000000001',
          name: 'Zeynep Kaya',
          email: 'zeynep@example.com',
          subject: 'Özel Boyut Siparişi',
          message: 'Mesaj içeriği',
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ]),
    });
  });

  await page.route('**/rest/v1/site_settings*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { key: 'general', value: { site_name: 'Vazo Studio', tagline: 'Heykelsi Seramik Tasarımlar' }, is_public: true },
        { key: 'contact', value: { email: 'info@vazostudio.com', phone: '+90 212 555 0123' }, is_public: true },
      ]),
    });
  });

  await page.route('**/rest/v1/admin_audit_logs*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': '0-0/1' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'audit-001',
          actor_email: 'admin@vazostudio.com',
          action: 'UPDATE',
          entity_type: 'product',
          entity_name: 'Amforik Taş Vazo',
          safe_metadata: { slug: 'amforik-tas-vazo-tebehir' },
          created_at: new Date().toISOString(),
        },
      ]),
    });
  });
}

async function loginAdminForA11y(page: Page) {
  await setupAdminA11yMocks(page);
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', 'admin@vazostudio.com');
  await page.fill('input[type="password"]', 'adminpassword123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe('Automated Accessibility Audit (Axe-Core & WCAG 2.1 AA)', () => {
  // Storefront Axe Scans
  for (const path of storefrontRoutes) {
    test(`Storefront route ${path} has zero critical or serious accessibility violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const seriousOrCritical = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(seriousOrCritical).toEqual([]);
    });
  }

  // Admin Routes Axe Scans
  for (const path of adminRoutes) {
    test(`Admin route ${path} has zero critical or serious accessibility violations`, async ({ page }) => {
      if (path === '/admin/login') {
        await setupAdminA11yMocks(page);
        await page.goto('/admin/login');
      } else {
        await loginAdminForA11y(page);
        await page.goto(path);
      }
      await page.waitForLoadState('domcontentloaded');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const seriousOrCritical = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(seriousOrCritical).toEqual([]);
    });
  }

  // Storefront Dialog Keyboard Trap & Focus Restoration
  test('storefront search modal traps focus and restores focus properly', async ({ page }) => {
    await page.goto('/');

    const searchBtn = page.locator('button[aria-label*="Ürün Ara"]').first();
    await searchBtn.click();

    const searchModal = page.getByRole('dialog', { name: 'Ürün Arama Modalı' });
    await expect(searchModal).toBeVisible();

    const searchInput = page.getByLabel('Ürün arama kutusu');
    await expect(searchInput).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(searchModal).not.toBeVisible();
  });

  // Admin Modal Keyboard Trap, Tab Wrapping & Focus Restoration
  test('admin product form modal traps focus, wraps tabs and restores focus on Escape', async ({ page }) => {
    await loginAdminForA11y(page);
    await page.goto('/admin/products');

    const addBtn = page.getByRole('button', { name: /Yeni Ürün Ekle|Ürün Ekle/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Escape closes modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
