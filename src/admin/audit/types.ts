export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'BULK_UPDATE';

export type AuditEntityType =
  | 'product'
  | 'variant'
  | 'inventory'
  | 'price'
  | 'wholesale_tier'
  | 'category'
  | 'collection'
  | 'cms_page'
  | 'cms_section'
  | 'faq_group'
  | 'faq_item'
  | 'menu_group'
  | 'menu_item'
  | 'site_settings'
  | 'trade_application'
  | 'contact_message'
  | 'newsletter_subscription'
  | 'shipping_zone'
  | 'shipping_zone_country'
  | 'shipping_rate'
  | 'order'
  | 'refund'
  | 'transactional_email';

export interface AdminAuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  admin_id?: string | null;
  action: AuditAction;
  entity_type: AuditEntityType;
  resource_type?: string | null;
  entity_id: string;
  resource_id?: string | null;
  entity_name: string | null;
  safe_metadata: Record<string, unknown>;
  diff?: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogFilter {
  entity_type?: 'all' | AuditEntityType;
  action?: 'all' | AuditAction;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditResult {
  data: AdminAuditLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
