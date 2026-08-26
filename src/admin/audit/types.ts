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
  | 'newsletter_subscription';

export interface AdminAuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_name: string | null;
  safe_metadata: Record<string, unknown>;
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
