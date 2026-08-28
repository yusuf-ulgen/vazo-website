import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
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
import { CheckoutPage } from '@/site/pages/CheckoutPage';
import { AboutPage } from '@/site/pages/AboutPage';
import { ContactPage } from '@/site/pages/ContactPage';
import { FaqPage } from '@/site/pages/FaqPage';
import { ShippingReturnsPolicyPage } from '@/site/pages/policies/ShippingReturnsPolicyPage';
import { PrivacyKvkkPolicyPage } from '@/site/pages/policies/PrivacyKvkkPolicyPage';
import { TermsOfServicePage } from '@/site/pages/policies/TermsOfServicePage';
import { PreliminaryInfoPolicyPage } from '@/site/pages/policies/PreliminaryInfoPolicyPage';
import { DistanceSalesPolicyPage } from '@/site/pages/policies/DistanceSalesPolicyPage';
import { AuthCallbackPage } from '@/site/pages/AuthCallbackPage';
import { AccountOverviewPage } from '@/site/pages/AccountOverviewPage';
import { AccountAddressesPage } from '@/site/pages/AccountAddressesPage';
import { AccountOrdersPage } from '@/site/pages/AccountOrdersPage';
import { AccountOrderDetailPage } from '@/site/pages/AccountOrderDetailPage';
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
const AdminProductsPage = React.lazy(() =>
  import('@/admin/products/pages/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage }))
);
const AdminCategoriesPage = React.lazy(() =>
  import('@/admin/categories/pages/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage }))
);
const AdminCollectionsPage = React.lazy(() =>
  import('@/admin/collections/pages/AdminCollectionsPage').then((m) => ({ default: m.AdminCollectionsPage }))
);
const AdminInventoryPage = React.lazy(() =>
  import('@/admin/inventory/pages/AdminInventoryPage').then((m) => ({ default: m.AdminInventoryPage }))
);
const AdminPricingPage = React.lazy(() =>
  import('@/admin/pricing/pages/AdminPricingPage').then((m) => ({ default: m.AdminPricingPage }))
);
const AdminWholesalePage = React.lazy(() =>
  import('@/admin/wholesale/pages/AdminWholesalePage').then((m) => ({ default: m.AdminWholesalePage }))
);
const AdminContentPage = React.lazy(() =>
  import('@/admin/content/pages/AdminContentPage').then((m) => ({ default: m.AdminContentPage }))
);
const AdminSubmissionsPage = React.lazy(() =>
  import('@/admin/submissions/pages/AdminSubmissionsPage').then((m) => ({ default: m.AdminSubmissionsPage }))
);
const AdminAuditPage = React.lazy(() =>
  import('@/admin/audit/pages/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage }))
);
const AdminSettingsPage = React.lazy(() =>
  import('@/admin/settings/pages/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);
const AdminShippingPage = React.lazy(() =>
  import('@/admin/shipping/pages/AdminShippingPage').then((m) => ({ default: m.AdminShippingPage }))
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
        path: 'checkout',
        element: <CheckoutPage />,
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
        path: 'auth/callback',
        element: <AuthCallbackPage />,
      },
      {
        path: 'account',
        element: <AccountOverviewPage />,
      },
      {
        path: 'account/addresses',
        element: <AccountAddressesPage />,
      },
      {
        path: 'account/orders',
        element: <AccountOrdersPage />,
      },
      {
        path: 'account/orders/:orderId',
        element: <AccountOrderDetailPage />,
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
        path: 'policies/preliminary-info',
        element: <PreliminaryInfoPolicyPage />,
      },
      {
        path: 'policies/distance-sales',
        element: <DistanceSalesPolicyPage />,
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
            <AdminProductsPage />
          </Suspense>
        ),
      },
      {
        path: 'categories',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminCategoriesPage />
          </Suspense>
        ),
      },
      {
        path: 'collections',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminCollectionsPage />
          </Suspense>
        ),
      },
      {
        path: 'inventory',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminInventoryPage />
          </Suspense>
        ),
      },
      {
        path: 'pricing',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminPricingPage />
          </Suspense>
        ),
      },
      {
        path: 'wholesale',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminWholesalePage />
          </Suspense>
        ),
      },
      {
        path: 'submissions',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminSubmissionsPage />
          </Suspense>
        ),
      },
      {
        path: 'audit',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminAuditPage />
          </Suspense>
        ),
      },
      {
        path: 'content',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminContentPage />
          </Suspense>
        ),
      },
      {
        path: 'shipping',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminShippingPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminSettingsPage />
          </Suspense>
        ),
      },
    ],
  },
  ],
},
]);

