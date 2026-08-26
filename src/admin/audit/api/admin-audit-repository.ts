import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { mockAuditLogs } from './audit-mocks';
import type {
  AdminAuditLog,
  AuditLogFilter,
  PaginatedAuditResult,
  AuditAction,
  AuditEntityType,
} from '../types';

const localAuditLogs: AdminAuditLog[] = [...mockAuditLogs];

export const adminAuditRepository = {
  async getAuditLogs(
    filters: AuditLogFilter = {}
  ): Promise<PaginatedAuditResult> {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 15);
    const action = filters.action || 'all';
    const entityType = filters.entity_type || 'all';
    const search = filters.search?.trim().toLowerCase();

    if (!isSupabaseConfigured || !supabase) {
      let filtered = [...localAuditLogs];

      if (action !== 'all') {
        filtered = filtered.filter((log) => log.action === action);
      }

      if (entityType !== 'all') {
        filtered = filtered.filter((log) => log.entity_type === entityType);
      }

      if (search) {
        filtered = filtered.filter(
          (log) =>
            log.entity_id.toLowerCase().includes(search) ||
            (log.entity_name && log.entity_name.toLowerCase().includes(search)) ||
            (log.actor_email && log.actor_email.toLowerCase().includes(search)) ||
            log.action.toLowerCase().includes(search) ||
            log.entity_type.toLowerCase().includes(search)
        );
      }

      filtered.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      const start = (page - 1) * pageSize;
      const data = filtered.slice(start, start + pageSize);

      return {
        data,
        totalCount,
        page,
        pageSize,
        totalPages,
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış. Canlı mod geçerli ortam değişkenleri gerektirir.');
    }

    let query = supabase
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
    if (!isSupabaseConfigured || !supabase) {
      const newLog: AdminAuditLog = {
        id: `aud-mock-${Date.now()}`,
        actor_user_id: 'a0000000-0000-0000-0000-000000000001',
        actor_email: 'admin@vazo.design',
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName || null,
        safe_metadata: safeMetadata,
        created_at: new Date().toISOString(),
      };
      localAuditLogs.unshift(newLog);
      return;
    }

    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase.rpc('log_admin_audit_event', {
        p_action: action,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_entity_name: entityName || null,
        p_safe_metadata: safeMetadata,
      });
    } catch (err) {
      console.warn('[adminAuditRepository.logAuditEvent] Audit log RPC warning:', err);
    }
  },
};
