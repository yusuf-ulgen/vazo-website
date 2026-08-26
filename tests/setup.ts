import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from './mocks/supabase-mock';
import {
  mockContactMessages,
  mockTradeApplications,
  mockNewsletterSubscriptions,
} from '@/admin/submissions/api/submissions-mocks';
import { mockAuditLogs } from '@/admin/audit/api/audit-mocks';
import { mockProducts } from '@/shared/mocks/products';
import {
  mockContentPages,
  mockFaqGroups,
} from '@/entities/content/api/content-mocks';
import { mockMenuGroups, mockMenuItems } from './mocks/navigation-mock';
import { DEFAULT_PUBLIC_SITE_SETTINGS } from '@/entities/settings/types';
import { mockCategories } from '@/entities/category/api/category-repository';
import { mockCollections } from '@/entities/collection/api/collection-repository';





export const mockAdminWholesaleBenefits = [
  {
    id: 'wb-01',
    title: 'Özel Toptan Fiyatlar',
    description: 'Kademeli iskonto oranları ve toptan alımlarda rekabetçi fiyatlandırma.',
    icon_name: 'Tag',
    sort_order: 1,
    active: true,
  },
  {
    id: 'wb-02',
    title: 'İç Mimarlar & Projelere Özel',
    description: 'Otel, restoran, lobi ve konut projeleri için özel hacim iskontoları ve numune desteği.',
    icon_name: 'Building2',
    sort_order: 2,
    active: true,
  },
  {
    id: 'wb-03',
    title: 'Düşük Minimum Sipariş (MOQ)',
    description: 'Model başına 3-6 adet arası düşük MOQ ile butik mağazalar için esnek stok yönetimi.',
    icon_name: 'PackageCheck',
    sort_order: 3,
    active: true,
  },
  {
    id: 'wb-04',
    title: 'Özel Sır & Renk Üretimi',
    description: 'Büyük ölçekli mimari projeler için RAL/Pantone uyumlu özel mineral sır geliştirme.',
    icon_name: 'Palette',
    sort_order: 4,
    active: true,
  },
  {
    id: 'wb-05',
    title: 'Güvenli Sandıklı Lojistik',
    description: 'Kırılmaya karşı sigortalı, paletli ve özel köpük ambalajlı sevkiyat.',
    icon_name: 'Truck',
    sort_order: 5,
    active: true,
  },
];

export const mockAdminHeroSlides = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    slot: 'retail',
    eyebrow: 'BİREYSEL ALIŞVERİŞ',
    title: 'Perakende',
    subtitle: null,
    description: 'Evinize estetik dokunuşlar katacak vazo koleksiyonlarımızı keşfedin.',
    image_url: '/images/hero-retail.jpg',
    primary_cta_text: 'Alışverişe Başla',
    primary_cta_url: '/products',
    secondary_cta_text: null,
    secondary_cta_url: null,
    sort_order: 1,
    active: true,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    slot: 'wholesale',
    eyebrow: 'PROFESYONEL ALIŞVERİŞ',
    title: 'Toptan',
    subtitle: null,
    description: 'Projeleriniz için özel fiyatlar, geniş ürün seçeneği ve profesyonel destek alın.',
    image_url: '/images/hero-wholesale.jpg',
    primary_cta_text: 'Toptan Alışverişe Geç',
    primary_cta_url: '/wholesale',
    secondary_cta_text: null,
    secondary_cta_url: null,
    sort_order: 2,
    active: true,
  },
];

export const mockContentPageRows = Object.values(mockContentPages).map((p) => ({
  id: p.id,
  page_key: p.pageKey,
  title: p.title,
  seo_title: p.seoTitle || null,
  seo_description: p.seoDescription || null,
  published: p.published,
  content_sections: p.sections.map((s) => ({
    id: s.id,
    page_id: p.id,
    section_key: s.sectionKey,
    eyebrow: s.eyebrow || null,
    title: s.title,
    subtitle: s.subtitle || null,
    content: s.content || null,
    image_url: s.imageUrl || null,
    image_position: s.imagePosition || null,
    cta_text: s.ctaText || null,
    cta_url: s.ctaUrl || null,
    sort_order: s.sortOrder,
    active: s.active,
  })),
}));

export const mockContentSectionRows = mockContentPageRows.flatMap((p) => p.content_sections);

export const mockFaqGroupRows = mockFaqGroups.map((g) => ({
  id: g.id,
  title: g.title,
  sort_order: g.sortOrder,
  active: g.active,
  faq_items: (g.items || []).map((i) => ({
    id: i.id,
    group_id: g.id,
    question: i.question,
    answer: i.answer,
    sort_order: i.sortOrder,
    active: i.active,
  })),
}));

export const mockFaqItemRows = mockFaqGroupRows.flatMap((g) => g.faq_items);

export const mockProductVariantRows = mockProducts.flatMap((p) =>
  (p.variants || []).map((v) => ({
    id: v.id,
    product_id: p.id,
    sku: v.sku,
    title: v.title,
    color_name: v.colorName,
    color_hex: v.colorHex,
    stock_quantity: v.stockQuantity ?? 10,
    retail_price: v.retailPrice,
    is_active: v.isActive ?? true,
    size_label: v.sizeLabel || null,
    height_cm: v.heightCm || null,
    diameter_cm: v.diameterCm || null,
    width_cm: v.widthCm || null,
    depth_cm: v.depthCm || null,
    weight_kg: v.weightKg || null,
  }))
);

export function createDefaultTestSupabaseClient() {
  const tableData: Record<string, { data: unknown[]; error: null }> = {
    contact_messages: { data: mockContactMessages, error: null },
    trade_applications: { data: mockTradeApplications, error: null },
    newsletter_subscriptions: { data: mockNewsletterSubscriptions, error: null },
    admin_audit_logs: { data: mockAuditLogs, error: null },
    products: { data: mockProducts, error: null },
    product_variants: { data: mockProductVariantRows, error: null },
    categories: {
      data: mockCategories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description || null,
        image_url: c.imageUrl || null,
        parent_id: c.parentId || null,
        active: true,
        sort_order: c.order || 1,
      })),
      error: null,
    },
    collections: {
      data: mockCollections.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description || null,
        image_url: c.imageUrl || null,
        active: true,
        sort_order: c.order || 1,
      })),
      error: null,
    },
    content_pages: { data: mockContentPageRows, error: null },
    content_sections: { data: mockContentSectionRows, error: null },
    hero_slides: { data: mockAdminHeroSlides, error: null },
    wholesale_benefits: { data: mockAdminWholesaleBenefits, error: null },
    faq_groups: { data: mockFaqGroupRows, error: null },
    faq_items: { data: mockFaqItemRows, error: null },
    menu_groups: { data: mockMenuGroups, error: null },
    menu_items: { data: mockMenuItems, error: null },
    site_settings: {
      data: [
        {
          key: 'general',
          value: {
            brand_name: DEFAULT_PUBLIC_SITE_SETTINGS.general.brandName,
            tagline: DEFAULT_PUBLIC_SITE_SETTINGS.general.tagline,
            description: DEFAULT_PUBLIC_SITE_SETTINGS.general.description,
          },
          is_public: true,
        },
        {
          key: 'contact',
          value: {
            email: DEFAULT_PUBLIC_SITE_SETTINGS.contact.email,
            wholesale_email: DEFAULT_PUBLIC_SITE_SETTINGS.contact.wholesaleEmail,
            phone: DEFAULT_PUBLIC_SITE_SETTINGS.contact.phone,
            address: DEFAULT_PUBLIC_SITE_SETTINGS.contact.address,
            business_hours: DEFAULT_PUBLIC_SITE_SETTINGS.contact.businessHours,
          },
          is_public: true,
        },
        {
          key: 'commerce',
          value: {
            free_shipping_threshold: DEFAULT_PUBLIC_SITE_SETTINGS.commerce.freeShippingThreshold,
            shipping_estimate_text: DEFAULT_PUBLIC_SITE_SETTINGS.commerce.shippingEstimateText,
            shipping_summary: DEFAULT_PUBLIC_SITE_SETTINGS.commerce.shippingSummary,
            returns_policy_text: DEFAULT_PUBLIC_SITE_SETTINGS.commerce.returnsPolicyText,
          },
          is_public: true,
        },
        {
          key: 'social',
          value: {
            instagram: DEFAULT_PUBLIC_SITE_SETTINGS.social.instagram,
            facebook: DEFAULT_PUBLIC_SITE_SETTINGS.social.facebook,
            pinterest: DEFAULT_PUBLIC_SITE_SETTINGS.social.pinterest,
          },
          is_public: true,
        },
      ],
      error: null,
    },
  };

  return createMockSupabaseClient(tableData);
}

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock window.alert
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

// Console hygiene
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  const defaultClient = createDefaultTestSupabaseClient();
  vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(defaultClient as never);
  vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
  vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(defaultClient as never);

  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('[productRepository') ||
      msg.includes('[categoryRepository') ||
      msg.includes('[collectionRepository') ||
      msg.includes('[contentRepository') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Not implemented') ||
      msg.includes('not wrapped in act') ||
      msg.includes('The above error occurred')
    ) {
      return;
    }
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('React Router') || msg.includes('UNSAFE_')) {
      return;
    }
    originalWarn(...args);
  };
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

