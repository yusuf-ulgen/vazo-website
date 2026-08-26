import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { adminProductRepository } from '@/admin/products/api/admin-product-repository';
import { adminInventoryRepository } from '@/admin/inventory/api/admin-inventory-repository';
import { adminCategoryRepository } from '@/admin/categories/api/admin-category-repository';
import { adminCollectionRepository } from '@/admin/collections/api/admin-collection-repository';
import { adminContactMessagesRepository } from '@/admin/submissions/api/admin-contact-messages-repository';
import { adminTradeApplicationsRepository } from '@/admin/submissions/api/admin-trade-applications-repository';
import { adminNewsletterRepository } from '@/admin/submissions/api/admin-newsletter-repository';
import { adminAuditRepository } from '@/admin/audit/api/admin-audit-repository';
import { mockProducts } from '@/shared/mocks/products';
import { mockCategories } from '@/entities/category/api/category-repository';
import { mockCollections } from '@/entities/collection/api/collection-repository';
import {
  mockContactMessages,
  mockTradeApplications,
  mockNewsletterSubscriptions,
} from '@/admin/submissions/api/submissions-mocks';
import { mockAuditLogs } from '@/admin/audit/api/audit-mocks';
import type { AdminProduct } from '@/admin/products/types';
import type { AdminCategory } from '@/admin/categories/types';
import type { AdminCollection } from '@/admin/collections/types';
import type { DashboardSummary } from '../types';

export const adminDashboardRepository = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    if (!isSupabaseConfigured || !supabase) {
      const prods = mockProducts;
      const publishedCount = prods.filter((p) => p.status === 'published').length;
      const draftCount = prods.filter((p) => p.status === 'draft').length;
      const archivedCount = prods.filter((p) => p.status === 'archived').length;

      const allVariants = prods.flatMap((p) => p.variants || []);
      const lowStockCount = allVariants.filter(
        (v) => (v.stockQuantity ?? 0) > 0 && (v.stockQuantity ?? 0) <= 5
      ).length;
      const outOfStockCount = allVariants.filter((v) => (v.stockQuantity ?? 0) === 0).length;
      const inStockCount = allVariants.filter((v) => (v.stockQuantity ?? 0) > 5).length;

      const activeCategoriesCount = mockCategories.length;
      const activeCollectionsCount = mockCollections.length;

      const pendingTradeCount = mockTradeApplications.filter((a) => a.status === 'pending').length;
      const newContactCount = mockContactMessages.filter((m) => m.status === 'new').length;
      const activeNewsletterCount = mockNewsletterSubscriptions.filter((s) => s.status === 'active').length;

      return {
        products: {
          total: prods.length,
          published: publishedCount,
          draft: draftCount,
          archived: archivedCount,
        },
        inventory: {
          totalVariants: allVariants.length,
          inStockVariants: inStockCount,
          lowStockVariants: lowStockCount,
          outOfStockVariants: outOfStockCount,
        },
        submissions: {
          pendingTradeApplications: pendingTradeCount,
          newContactMessages: newContactCount,
          activeNewsletterSubscribers: activeNewsletterCount,
        },
        taxonomies: {
          activeCategories: activeCategoriesCount,
          activeCollections: activeCollectionsCount,
        },
        recentAuditLogs: mockAuditLogs.slice(0, 6),
      };
    }

    const [
      productsResult,
      inventoryResult,
      categories,
      collections,
      contactMessagesResult,
      tradeAppsResult,
      newsletterResult,
      auditLogsResult,
    ] = await Promise.all([
      adminProductRepository.getProducts({ page: 1, pageSize: 100 }),
      adminInventoryRepository.getInventory({ page: 1, pageSize: 100 }),
      adminCategoryRepository.getAllCategories(),
      adminCollectionRepository.getAllCollections(),
      adminContactMessagesRepository.getContactMessages({ status: 'new', pageSize: 1 }),
      adminTradeApplicationsRepository.getTradeApplications({ status: 'pending', pageSize: 1 }),
      adminNewsletterRepository.getNewsletterSubscriptions({ status: 'active', pageSize: 1 }),
      adminAuditRepository.getAuditLogs({ pageSize: 6 }),
    ]);

    const prods: AdminProduct[] = productsResult.data;
    const publishedCount = prods.filter((p: AdminProduct) => p.status === 'published').length;
    const draftCount = prods.filter((p: AdminProduct) => p.status === 'draft').length;
    const archivedCount = prods.filter((p: AdminProduct) => p.status === 'archived').length;

    const activeCategoriesCount = categories.filter((c: AdminCategory) => c.active).length;
    const activeCollectionsCount = collections.filter((c: AdminCollection) => c.active).length;

    return {
      products: {
        total: productsResult.totalCount || prods.length,
        published: publishedCount,
        draft: draftCount,
        archived: archivedCount,
      },
      inventory: {
        totalVariants: inventoryResult.metrics.totalVariants,
        inStockVariants: inventoryResult.metrics.inStockCount,
        lowStockVariants: inventoryResult.metrics.lowStockCount,
        outOfStockVariants: inventoryResult.metrics.outOfStockCount,
      },
      submissions: {
        pendingTradeApplications: tradeAppsResult.totalCount,
        newContactMessages: contactMessagesResult.totalCount,
        activeNewsletterSubscribers: newsletterResult.totalCount,
      },
      taxonomies: {
        activeCategories: activeCategoriesCount,
        activeCollections: activeCollectionsCount,
      },
      recentAuditLogs: auditLogsResult.data,
    };
  },
};
