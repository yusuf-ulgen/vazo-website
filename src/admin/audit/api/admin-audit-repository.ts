import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import type {
  AdminAuditLog,
  AuditLogFilter,
  PaginatedAuditResult,
  AuditAction,
  AuditEntityType,
} from '../types';

export const adminAuditRepository = {
  async getAuditLogs(
    filters: AuditLogFilter = {}
  ): Promise<PaginatedAuditResult> {
    const client = requireAdminSupabase();

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 15);
    const action = filters.action || 'all';
    const entityType = filters.entity_type || 'all';
    const search = filters.search?.trim().toLowerCase();

    let query = client
      .from('admin_audit_logs')
      .select('*', { count: 'exact' });

    if (action !== 'all') {
      query = query.eq('action', action);
    }

    if (entityType !== 'all') {
      query = query.eq('entity_type', entityType);
    }

    if (search) {
      query = query.or(
        `entity_id.ilike.%${search}%,entity_name.ilike.%${search}%,actor_email.ilike.%${search}%`
      );
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[adminAuditRepository.getAuditLogs] Error:', error.message);
      throw new Error(`Denetim kayıtları yüklenemedi: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      data: (data || []) as AdminAuditLog[],
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async logAuditEvent(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    entityName?: string,
    safeMetadata: Record<string, unknown> = {}
  ): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.rpc('log_admin_audit_event', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_entity_name: entityName || null,
      p_safe_metadata: safeMetadata,
    });

    if (error) {
      console.error('[adminAuditRepository.logAuditEvent] RPC error:', error.message);
      throw new Error(`Denetim kaydı oluşturulamadı: ${error.message}`);
    }
  },
};
