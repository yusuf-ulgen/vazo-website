import { Page, expect } from '@playwright/test';

export async function setupAdminA11yMocks(page: Page) {
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
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminUser) });
  });

  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sessionObj) });
  });

  await page.route('**/rest/v1/admin_users*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user_id: adminUser.id, role: 'admin', active: true }),
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
      body: JSON.stringify([{ id: 'c1000000-0000-0000-0000-000000000001', page_key: 'about', title: 'Hakkımızda', published: true }]),
    });
  });

  await page.route('**/rest/v1/content_sections*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'c2000000-0000-0000-0000-000000000001', page_id: 'c1000000-0000-0000-0000-000000000001', section_key: 'hero', title: 'Felsefemiz', active: true, sort_order: 1 }]),
    });
  });

  await page.route('**/rest/v1/hero_slides*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'a1000000-0000-0000-0000-000000000001', slot: 'retail', title: 'Perakende', sort_order: 1, active: true }]),
    });
  });

  await page.route('**/rest/v1/wholesale_benefits*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'a5000000-0000-0000-0000-000000000001', title: 'Mimari Destek', sort_order: 1 }]),
    });
  });

  await page.route('**/rest/v1/faq_groups*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'f1000000-0000-0000-0000-000000000001', title: 'Sipariş & Teslimat', sort_order: 1, active: true }]),
    });
  });

  await page.route('**/rest/v1/faq_items*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'f2000000-0000-0000-0000-000000000001', group_id: 'f1000000-0000-0000-0000-000000000001', question: 'Kargo süresi?', answer: '1-3 gün', sort_order: 1, active: true }]),
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
        { key: 'commerce', value: { checkout_enabled: true }, is_public: true },
        {
          key: 'seller_legal',
          value: {
            business_type: 'sole_proprietorship',
            owner_full_name: 'Yusuf Ülgen',
            legal_trade_title: 'Yusuf Ülgen - Monocactus',
            tax_office: 'Beyoğlu',
            tax_number: '1234567890',
            registered_address: 'Karaköy Cad. No: 1, İstanbul',
            kep_address: 'yusuf.ulgen@hs01.kep.tr',
            business_email: 'info@monocactus.com',
            business_phone: '+90 212 555 0123',
          },
          is_public: true,
        },
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

  await page.route('**/rest/v1/orders*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': '0-0/1' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'e1000000-0000-0000-0000-000000000001',
          order_number: 'VZ-20260828-AAAA1',
          customer_id: 'c1000000-0000-0000-0000-000000000001',
          channel: 'retail',
          status: 'paid',
          currency: 'TRY',
          total_minor: 30000,
          subtotal_minor: 25000,
          shipping_minor: 5000,
          discount_minor: 0,
          shipping_address: { recipient_name: 'Ahmet Yılmaz', city: 'İstanbul', phone: '05551112233' },
          billing_address: { recipient_name: 'Ahmet Yılmaz', city: 'İstanbul' },
          order_items: [],
          payments: [{ id: 'b1000000-0000-0000-0000-000000000001', status: 'paid', expected_amount_minor: 30000, refunded_amount_minor: 0, currency: 'TRY', merchant_oid: 'VZ20260828AAAA1PAY1' }],
          created_at: new Date().toISOString(),
        },
      ]),
    });
  });

  await page.route('**/rest/v1/payments*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': '0-0/1' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'b1000000-0000-0000-0000-000000000001',
          order_id: 'e1000000-0000-0000-0000-000000000001',
          provider: 'paytr',
          merchant_oid: 'VZ20260828AAAA1PAY1',
          status: 'paid',
          expected_amount_minor: 30000,
          refunded_amount_minor: 0,
          currency: 'TRY',
          test_mode: true,
          initiated_at: new Date().toISOString(),
          orders: { order_number: 'VZ-20260828-AAAA1', customer_id: 'c1000000-0000-0000-0000-000000000001', shipping_address: { recipient_name: 'Ahmet Yılmaz', phone: '05551112233' } },
        },
      ]),
    });
  });

  await page.route('**/rest/v1/shipping_zones*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': '0-0/1' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'sz000000-0000-0000-0000-000000000001',
          name: 'Türkiye İçi',
          active: true,
          priority: 1,
          retail_enabled: true,
          wholesale_enabled: true,
          shipping_zone_countries: [{ id: 'szc1', country_code: 'TR', country_name: 'Türkiye', active: true }],
          shipping_rates: [{ id: 'sr1', name: 'Standart Teslimat', flat_amount_minor: 15000, free_shipping_threshold_minor: 500000, currency: 'TRY', active: true }],
        },
      ]),
    });
  });

  await page.route('**/rest/v1/shipping_rates*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'sr1', zone_id: 'sz000000-0000-0000-0000-000000000001', name: 'Standart Teslimat', flat_amount_minor: 15000, free_shipping_threshold_minor: 500000, currency: 'TRY', active: true },
      ]),
    });
  });
}

export async function loginAdminForA11y(page: Page) {
  await setupAdminA11yMocks(page);
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', 'admin@vazostudio.com');
  await page.fill('input[type="password"]', 'adminpassword123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin$/);
}

export async function setupCustomerA11yMocks(page: Page) {
  const customerUser = {
    id: 'c1000000-0000-0000-0000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'customer.a@vazostudio.com',
    email_confirmed_at: '2026-08-01T00:00:00.000Z',
    app_metadata: { provider: 'google', providers: ['google'] },
    user_metadata: { full_name: 'Ahmet Yılmaz' },
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-26T00:00:00.000Z',
  };

  const sessionObj = {
    access_token: 'mock-customer-token-xyz',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-customer-refresh-token',
    user: customerUser,
  };

  await page.addInitScript((session) => {
    window.localStorage.setItem('sb-127-0-0-1-auth-token', JSON.stringify(session));
  }, sessionObj);

  await page.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(customerUser) });
  });

  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sessionObj) });
  });

  await page.route('**/rest/v1/customer_profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: customerUser.id,
        first_name: 'Ahmet',
        last_name: 'Yılmaz',
        phone: '05551112233',
        customer_type: 'retail',
      }),
    });
  });

  await page.route('**/rest/v1/customer_addresses*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'd1000000-0000-0000-0000-000000000001',
          user_id: customerUser.id,
          recipient_name: 'Ahmet Yılmaz',
          phone: '05551112233',
          address_line1: 'Moda Cad. No:1',
          city: 'İstanbul',
          district: 'Kadıköy',
          postal_code: '34710',
          country_code: 'TR',
          country_name: 'Türkiye',
          is_default_shipping: true,
          is_default_billing: true,
        },
      ]),
    });
  });

  await page.route('**/rest/v1/orders*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'e1000000-0000-0000-0000-000000000001',
          order_number: 'VZ-20260828-AAAA1',
          customer_id: customerUser.id,
          channel: 'retail',
          status: 'paid',
          currency: 'TRY',
          total_minor: 30000,
          created_at: new Date().toISOString(),
          order_items: [],
        },
      ]),
    });
  });
}
