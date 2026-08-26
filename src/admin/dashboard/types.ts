import { AdminAuditLog } from '@/admin/audit/types';

export interface DashboardProductMetrics {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export interface DashboardInventoryMetrics {
  totalVariants: number;
  inStockVariants: number;
  lowStockVariants: number;
  outOfStockVariants: number;
}

export interface DashboardSubmissionsMetrics {
  pendingTradeApplications: number;
  newContactMessages: number;
  activeNewsletterSubscribers: number;
}

export interface DashboardTaxonomyMetrics {
  activeCategories: number;
  activeCollections: number;
}

export interface DashboardSummary {
  products: DashboardProductMetrics;
  inventory: DashboardInventoryMetrics;
  submissions: DashboardSubmissionsMetrics;
  taxonomies: DashboardTaxonomyMetrics;
  recentAuditLogs: AdminAuditLog[];
}
