import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import { adminAuditRepository } from '@/admin/audit/api/admin-audit-repository';
import type { DashboardSummary } from '../types';

export const adminDashboardRepository = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const client = requireAdminSupabase();

    const [
      totalProductsRes,
      publishedProductsRes,
      draftProductsRes,
      archivedProductsRes,
      variantsRes,
      categoriesRes,
      collectionsRes,
      tradeAppsRes,
      contactMessagesRes,
      newsletterRes,
      ordersRes,
      refundsRes,
      auditLogsResult,
    ] = await Promise.all([
      client.from('products').select('*', { count: 'exact', head: true }),
      client.from('products').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      client.from('products').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      client.from('products').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
      client.from('product_variants').select('stock_quantity'),
      client.from('categories').select('*', { count: 'exact', head: true }).eq('active', true),
      client.from('collections').select('*', { count: 'exact', head: true }).eq('active', true),
      client.from('trade_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      client.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      client.from('orders').select('status, total_minor'),
      client.from('refunds').select('amount_minor').eq('status', 'succeeded'),
      adminAuditRepository.getAuditLogs({ pageSize: 6 }),
    ]);

    if (totalProductsRes.error) {
      console.error('[adminDashboardRepository] Total products count error:', totalProductsRes.error.message);
      throw new Error(`Ürün metrikleri alınamadı: ${totalProductsRes.error.message}`);
    }

    const allVariants = variantsRes.data || [];
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    allVariants.forEach((v: { stock_quantity: number | string | null }) => {
      const qty = Number(v.stock_quantity) || 0;
      if (qty === 0) {
        outOfStockCount++;
      } else if (qty <= 5) {
        lowStockCount++;
        inStockCount++;
      } else {
        inStockCount++;
      }
    });

    const allOrders = ordersRes.data || [];
    let paidRevenueMinor = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;
    let awaitingFulfillmentCount = 0;

    allOrders.forEach((o: { status: string; total_minor: number | string }) => {
      const total = Number(o.total_minor) || 0;
      if (['paid', 'processing', 'shipped', 'delivered', 'partially_refunded'].includes(o.status)) {
        paidRevenueMinor += total;
        paidOrdersCount++;
      }
      if (o.status === 'paid') {
        awaitingFulfillmentCount++;
      }
      if (o.status === 'pending_payment') {
        pendingOrdersCount++;
      }
    });

    const allRefunds = refundsRes.data || [];
    const refundedTotalMinor = allRefunds.reduce((sum: number, r: { amount_minor: number | string }) => sum + (Number(r.amount_minor) || 0), 0);

    return {
      orders: {
        paidRevenueMinor,
        paidOrdersCount,
        pendingOrdersCount,
        awaitingFulfillmentCount,
        refundedTotalMinor,
      },
      products: {
        total: totalProductsRes.count || 0,
        published: publishedProductsRes.count || 0,
        draft: draftProductsRes.count || 0,
        archived: archivedProductsRes.count || 0,
      },
      inventory: {
        totalVariants: allVariants.length,
        inStockVariants: inStockCount,
        lowStockVariants: lowStockCount,
        outOfStockVariants: outOfStockCount,
      },
      submissions: {
        pendingTradeApplications: tradeAppsRes.count || 0,
        newContactMessages: contactMessagesRes.count || 0,
        activeNewsletterSubscribers: newsletterRes.count || 0,
      },
      taxonomies: {
        activeCategories: categoriesRes.count || 0,
        activeCollections: collectionsRes.count || 0,
      },
      recentAuditLogs: auditLogsResult.data,
    };
  },
};
