import { describe, it, expect } from 'vitest';
import { adminDashboardRepository } from '@/admin/dashboard/api/admin-dashboard-repository';

describe('adminDashboardRepository', () => {
  it('returns comprehensive dashboard summary with real product, inventory, and submission counts', async () => {
    const summary = await adminDashboardRepository.getDashboardSummary();

    // Orders metrics (Phase 3.7)
    expect(summary.orders).toBeDefined();
    expect(typeof summary.orders.paidRevenueMinor).toBe('number');
    expect(typeof summary.orders.paidOrdersCount).toBe('number');
    expect(typeof summary.orders.pendingOrdersCount).toBe('number');
    expect(typeof summary.orders.awaitingFulfillmentCount).toBe('number');
    expect(typeof summary.orders.refundedTotalMinor).toBe('number');

    // Products metrics
    expect(summary.products.total).toBeGreaterThan(0);
    expect(summary.products.published + summary.products.draft + summary.products.archived).toBe(
      summary.products.total
    );

    // Inventory metrics
    expect(summary.inventory.totalVariants).toBeGreaterThan(0);
    expect(
      summary.inventory.inStockVariants +
        summary.inventory.lowStockVariants +
        summary.inventory.outOfStockVariants
    ).toBe(summary.inventory.totalVariants);

    // Submissions metrics
    expect(typeof summary.submissions.pendingTradeApplications).toBe('number');
    expect(typeof summary.submissions.newContactMessages).toBe('number');
    expect(typeof summary.submissions.activeNewsletterSubscribers).toBe('number');

    // Taxonomies
    expect(summary.taxonomies.activeCategories).toBeGreaterThan(0);
    expect(summary.taxonomies.activeCollections).toBeGreaterThan(0);

    // Audit logs
    expect(Array.isArray(summary.recentAuditLogs)).toBe(true);
    expect(summary.recentAuditLogs.length).toBeLessThanOrEqual(6);
  });
});
