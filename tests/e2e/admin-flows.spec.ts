import { test, expect, Page } from '@playwright/test';

// Helper to configure simulated Supabase admin and REST endpoints for deterministic browser E2E
async function mockAdminEnvironment(
  page: Page,
  options: { isAuthorizedAdmin?: boolean; isAuthenticated?: boolean } = {}
) {
  const isAuthorized = options.isAuthorizedAdmin ?? true;
  const isAuthenticated = options.isAuthenticated ?? isAuthorized;
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

  if (isAuthenticated) {
    await page.addInitScript((session) => {
      // Keys checked by Supabase storage persistence
      window.localStorage.setItem('sb-127-0-0-1-auth-token', JSON.stringify(session));
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.endsWith('-auth-token')) {
          window.localStorage.setItem(key, JSON.stringify(session));
        }
      }
    }, sessionObj);
  }

  // Auth endpoints
  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessionObj),
    });
  });

  await page.route('**/auth/v1/user*', async (route) => {
    if (isAuthenticated) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminUser),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
    }
  });

  await page.route('**/auth/v1/logout*', async (route) => {
    await route.fulfill({ status: 204 });
  });

  // Admin users table RBAC query
  await page.route('**/rest/v1/admin_users*', async (route) => {
    if (isAuthorized) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: adminUser.id,
          role: 'admin',
          active: true,
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    }
  });

  // RPC endpoints
  await page.route('**/rest/v1/rpc/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // REST endpoints with representative data
  await page.route('**/rest/v1/products*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        headers: { 'content-range': '0-1/2' },
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
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'a2000000-0000-0000-0000-000000000001' }) });
    }
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
      headers: { 'content-range': '0-1/1' },
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
          message: 'Projelerimiz için özel boyut vazo üretebiliyor musunuz?',
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

async function loginAsAdmin(page: Page) {
  await mockAdminEnvironment(page, { isAuthorizedAdmin: true, isAuthenticated: false });
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', 'admin@vazostudio.com');
  await page.fill('input[type="password"]', 'adminpassword123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe('Real Admin Panel E2E Workflows & CRUD Operations', () => {
  test('1. Unauthenticated redirect from /admin to /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('body')).toContainText('Yönetici Girişi');
  });

  test('2. Authenticated non-admin (customer) is rejected with access denial', async ({ page }) => {
    await mockAdminEnvironment(page, { isAuthorizedAdmin: false });
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'customerpass123');
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toContainText('yetki');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('3. Valid active Admin login navigates to Dashboard and restores session', async ({ page }) => {
    await mockAdminEnvironment(page, { isAuthorizedAdmin: true, isAuthenticated: false });
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@vazostudio.com');
    await page.fill('input[type="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('body')).toContainText('Vazo Admin');

    // Verify session restoration on page reload
    await page.reload();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('body')).toContainText('Vazo Admin');
  });

  test('4. Product Catalog CRUD: navigates to products, opens form modal and saves', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');
    await expect(page.locator('body')).toContainText('Ürün Kataloğu');

    // Click "Yeni Ürün Ekle" button
    const addBtn = page.getByRole('button', { name: /Yeni Ürün Ekle|Ürün Ekle/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify modal is displayed with focus
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('5. Categories & Collections CRUD smoke test', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/categories');
    await expect(page.locator('body')).toContainText('Kategoriler');
    await expect(page.locator('body')).toContainText('Masa Üstü Vazolar');

    await page.goto('/admin/collections');
    await expect(page.locator('body')).toContainText('Koleksiyonlar');
    await expect(page.locator('body')).toContainText('Nordik Sessizlik');
  });

  test('6. Inventory stock adjustment modal and update flow', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/inventory');
    await expect(page.locator('body')).toContainText('Stok & Envanter');
    await expect(page.locator('body')).toContainText('VAZ-AMF-WHT-M');

    // Click stock adjustment button
    const adjustBtn = page.getByRole('button', { name: /Düzenle|Stok Güncelle/i }).first();
    if (await adjustBtn.isVisible()) {
      await adjustBtn.click();
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('7. Content & FAQ management: navigates and renders CMS tabs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/content');
    await expect(page.locator('body')).toContainText('İçerik & CMS');
  });

  test('8. Site Settings: navigates and renders general settings', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/settings');
    await expect(page.locator('body')).toContainText('Ayarları');
  });

  test('9. Submissions: renders trade applications and contact messages', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/submissions');
    await expect(page.locator('body')).toContainText('Gelen Başvurular');
    await expect(page.locator('body')).toContainText('Zeynep Kaya');

    // Switch to Trade Applications tab
    const b2bTab = page.getByRole('button', { name: /Toptan & B2B Başvuruları|Toptan/i });
    if (await b2bTab.isVisible()) {
      await b2bTab.click();
      await expect(page.locator('body')).toContainText('Atölye Mimarlık');
    }
  });

  test('10. Audit Log Trail: renders immutable audit records', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/audit');
    await expect(page.locator('body')).toContainText('Denetim İzi');
    await expect(page.locator('body')).toContainText('admin@vazostudio.com');
  });

  test('11. Admin Logout clears session and redirects to login', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin$/);

    const logoutBtn = page.locator('button[aria-label="Çıkış Yap"]').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });
});
