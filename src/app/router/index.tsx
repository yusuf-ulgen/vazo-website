import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import {
  Package,
  Layers,
  Sparkles,
  Boxes,
  Percent,
  Building2,
  ShoppingCart,
  FileText,
  Settings,
} from 'lucide-react';
import { SiteLayout } from '@/site/layouts/SiteLayout';
import { HomePage } from '@/site/pages/HomePage';
import { CatalogPage } from '@/site/pages/CatalogPage';
import { CategoryPage } from '@/site/pages/CategoryPage';
import { CollectionsIndexPage } from '@/site/pages/CollectionsIndexPage';
import { CollectionDetailPage } from '@/site/pages/CollectionDetailPage';
import { ProductDetailPage } from '@/site/pages/ProductDetailPage';
import { WholesaleLandingPage } from '@/site/pages/wholesale/WholesaleLandingPage';
import { WholesaleProductsPage } from '@/site/pages/wholesale/WholesaleProductsPage';
import { WholesaleHowItWorksPage } from '@/site/pages/wholesale/WholesaleHowItWorksPage';
import { WholesaleApplyPage } from '@/site/pages/wholesale/WholesaleApplyPage';
import { WishlistPage } from '@/site/pages/WishlistPage';
import { CartPage } from '@/site/pages/CartPage';
import { AboutPage } from '@/site/pages/AboutPage';
import { ContactPage } from '@/site/pages/ContactPage';
import { FaqPage } from '@/site/pages/FaqPage';
import { ShippingReturnsPolicyPage } from '@/site/pages/policies/ShippingReturnsPolicyPage';
import { PrivacyKvkkPolicyPage } from '@/site/pages/policies/PrivacyKvkkPolicyPage';
import { TermsOfServicePage } from '@/site/pages/policies/TermsOfServicePage';
import { NotFoundPage } from '@/site/pages/NotFoundPage';

// Admin Code Splitting (Lazy-loaded to keep public initial bundle clean)
import { AdminAuthProvider } from '@/admin/auth/AdminAuthProvider';

const AdminLoginPage = React.lazy(() =>
  import('@/admin/pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminGuard = React.lazy(() =>
  import('@/admin/auth/AdminGuard').then((m) => ({ default: m.AdminGuard }))
);
const AdminLayout = React.lazy(() =>
  import('@/admin/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminDashboardPage = React.lazy(() =>
  import('@/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminModuleScaffoldPage = React.lazy(() =>
  import('@/admin/pages/AdminModuleScaffoldPage').then((m) => ({ default: m.AdminModuleScaffoldPage }))
);

const adminFallback = (
  <div className="min-h-screen bg-canvas-default flex items-center justify-center p-8 text-xs font-sans text-text-secondary">
    <span>Yönetici paneli yükleniyor...</span>
  </div>
);

export const router = createBrowserRouter([
  // Public Storefront Routes
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'products',
        element: <CatalogPage mode="all" />,
      },
      {
        path: 'new',
        element: <CatalogPage mode="new" />,
      },
      {
        path: 'bestsellers',
        element: <CatalogPage mode="bestseller" />,
      },
      {
        path: 'categories',
        element: <CatalogPage mode="all" />,
      },
      {
        path: 'categories/:slug',
        element: <CategoryPage />,
      },
      {
        path: 'collections',
        element: <CollectionsIndexPage />,
      },
      {
        path: 'collections/:slug',
        element: <CollectionDetailPage />,
      },
      {
        path: 'products/:slug',
        element: <ProductDetailPage />,
      },
      {
        path: 'wishlist',
        element: <WishlistPage />,
      },
      {
        path: 'cart',
        element: <CartPage />,
      },
      {
        path: 'wholesale',
        element: <WholesaleLandingPage />,
      },
      {
        path: 'wholesale/products',
        element: <WholesaleProductsPage />,
      },
      {
        path: 'wholesale/how-it-works',
        element: <WholesaleHowItWorksPage />,
      },
      {
        path: 'wholesale/apply',
        element: <WholesaleApplyPage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },
      {
        path: 'faq',
        element: <FaqPage />,
      },
      {
        path: 'policies/shipping-returns',
        element: <ShippingReturnsPolicyPage />,
      },
      {
        path: 'policies/privacy-kvkk',
        element: <PrivacyKvkkPolicyPage />,
      },
      {
        path: 'policies/terms',
        element: <TermsOfServicePage />,
      },
      {
        path: 'privacy',
        element: <PrivacyKvkkPolicyPage />,
      },
      {
        path: 'terms',
        element: <TermsOfServicePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },

  // Dedicated Admin Login Route
  {
    path: '/admin/login',
    element: (
      <AdminAuthProvider>
        <Suspense fallback={adminFallback}>
          <AdminLoginPage />
        </Suspense>
      </AdminAuthProvider>
    ),
  },

  // Back-Office Protected Admin Panel Routes
  {
    path: '/admin',
    element: (
      <AdminAuthProvider>
        <Suspense fallback={adminFallback}>
          <AdminGuard />
        </Suspense>
      </AdminAuthProvider>
    ),
    children: [
      {
        element: (
          <Suspense fallback={adminFallback}>
            <AdminLayout />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={adminFallback}>
                <AdminDashboardPage />
              </Suspense>
            ),
          },
      {
        path: 'products',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminModuleScaffoldPage
              moduleName="Ürün Yönetimi (CRUD)"
              moduleCode="MOD-PROD-01"
              description="Tasarım vazo modelleri, varyant matrisleri, fiziksel boyutlar ve yayınlama durumları."
              icon={Package}
              plannedFeatures={[
                'Vazo model ekleme / düzenleme / arşivleme',
                'SKU bazlı varyant matrisi ve boyut tanımları (Yükseklik, Çap, Ağırlık)',
                'Çoklu görsel galerisi ve sıralama',
                'Perakende ve toptan kanal görünürlük anahtarları',
              ]}
            />
          </Suspense>
        ),
      },
      {
        path: 'categories',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminModuleScaffoldPage
              moduleName="Kategori Yönetimi"
              moduleCode="MOD-CAT-02"
              description="Masa üstü, zemin, heykelsi objeler ve set kategorilerinin hiyerarşik yönetimi."
              icon={Layers}
              plannedFeatures={[
                'Hiyerarşik kategori ağacı oluşturma',
                'Kategori görseli ve açıklama yönetimi',
                'Sıralama ve öne çıkarma kontrolleri',
              ]}
            />
          </Suspense>
        ),
      },
      {
        path: 'collections',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminModuleScaffoldPage
              moduleName="Koleksiyon Kürasyonu"
              moduleCode="MOD-COL-03"
              description="Nordik Sessizlik, Amforik Kıvrımlar ve editoryal sezon koleksiyonları."
              icon={Sparkles}
              plannedFeatures={[
                'Sezonluk koleksiyon hikayesi ve görseli oluşturma',
                'Koleksiyona ürün bağlama ve vitrin sıralaması',
                'Ana sayfa görünürlük toggle kontrolü',
              ]}
            />
          </Suspense>
        ),
      },
      {
        path: 'inventory',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminModuleScaffoldPage
              moduleName="Stok & Envanter Takibi"
              moduleCode="MOD-INV-04"
              description="Stoneware seramik stok miktarları, atölye fırınlama takibi ve düşük stok uyarıları."
              icon={Boxes}
              plannedFeatures={[
                'Varyant bazında gerçek zamanlı stok sayımı',
                'Kritik stok eşiği belirleme ve e-posta uyarıları',
                'Toptan siparişler için ayrılmış stok rezervasyonu',
              ]}
            />
          </Suspense>
        ),
      },
      {
        path: 'pricing',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminModuleScaffoldPage
              moduleName="Perakende & Fiyatlandırma"
              moduleCode="MOD-PRC-05"
              description="Standart perakende fiyatları, indirim oranları ve liste fiyat güncellemeleri."
              icon={Percent}
              plannedFeatures={[
                'Tekil ve toplu fiyat güncelleme',
                'Karşılaştırma fiyatı (eski fiyat) tanımlama',
                'Para birimi ve KDV oranları yapılandırması',
              ]}
            />
          </Suspense>
        ),
      },
      {
        path: 'wholesale',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminModuleScaffoldPage
              moduleName="Toptan Portalı"
              moduleCode="MOD-B2B-06"
              description="Kademeli hacim iskontoları, MOQ kuralları ve mimar/bayi başvuru onayı."
              icon={Building2}
              plannedFeatures={[
                'Gelen Trade & Mimari başvuru kuyruğunu onaylama/reddetme',
                'Model ve kategori bazında Minimum Sipariş Adedi (MOQ) belirleme',
                'Miktar kademe indirim tablosu (10-49 adet, 50+ adet)',
                'Özel mimari projeler için teklif (quote) talepleri yönetimi',
              ]}
            />
          </Suspense>
        ),
      },
      {
        path: 'orders',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminModuleScaffoldPage
              moduleName="Sipariş & Sevkiyat Yönetimi"
              moduleCode="MOD-ORD-07"
              description="Perakende ve toptan siparişler, sandıklı sevkiyat ve kargo takip entegrasyonu."
              icon={ShoppingCart}
              plannedFeatures={[
                'Perakende ve toptan sipariş filtreleme sekmeleri',
                'Sipariş durumu güncelleme (Ödeme Bekliyor, Hazırlanıyor, Kargoda)',
                'Kargo takip numarası girişi ve otomatik bildirim',
                'İrsaliye ve e-fatura yazdırma',
              ]}
            />
          </Suspense>
        ),
      },
      {
        path: 'content',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminModuleScaffoldPage
              moduleName="İçerik & CMS Yönetimi"
              moduleCode="MOD-CMS-08"
              description="Duyuru çubuğu, ana sayfa hero metinleri, mega-menü kartları ve editoryal bloklar."
              icon={FileText}
              plannedFeatures={[
                'Duyuru bandı metni ve linki düzenleme',
                'Ana sayfa hero başlık, görsel ve CTA butonları',
                'Mega menü öne çıkan promosyon kartları yönetimi',
                'Editoryal zanaat hikayesi bloklarının sıralanması',
              ]}
            />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminModuleScaffoldPage
              moduleName="Sistem & Stüdyo Ayarları"
              moduleCode="MOD-SET-09"
              description="Stüdyo iletişim bilgileri, adres, çalışma saatleri ve genel e-ticaret parametreleri."
              icon={Settings}
              plannedFeatures={[
                'Stüdyo iletişim ve fatura bilgileri',
                'Varsayılan kargo ve teslimat parametreleri',
                'Sosyal medya hesap bağlantıları',
              ]}
            />
          </Suspense>
        ),
      },
    ],
  },
  ],
},
]);

