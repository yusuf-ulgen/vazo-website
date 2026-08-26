import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminAuditRepository } from '@/admin/audit/api/admin-audit-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from '../../mocks/supabase-mock';
import { mockAuditLogs } from '@/admin/audit/api/audit-mocks';

describe('adminAuditRepository', () => {
  beforeEach(() => {
    const mockClient = createMockSupabaseClient({
      admin_audit_logs: { data: mockAuditLogs, error: null },
    });
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
  });

  it('returns paginated audit logs', async () => {
    const result = await adminAuditRepository.getAuditLogs({ page: 1, pageSize: 3 });
    expect(result.data.length).toBeLessThanOrEqual(3);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(3);
  });

  it('filters audit logs by action', async () => {
    const result = await adminAuditRepository.getAuditLogs({ action: 'STATUS_CHANGE' });
    for (const log of result.data) {
      expect(log.action).toBe('STATUS_CHANGE');
    }
  });

  it('filters audit logs by entity_type', async () => {
    const result = await adminAuditRepository.getAuditLogs({ entity_type: 'trade_application' });
    for (const log of result.data) {
      expect(log.entity_type).toBe('trade_application');
    }
  });

  it('searches audit logs by entity name or id', async () => {
    const result = await adminAuditRepository.getAuditLogs({ search: 'Pera Concept' });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.entity_name).toContain('Pera Concept');
  });

  it('appends new audit events securely', async () => {
    await adminAuditRepository.logAuditEvent(
      'UPDATE',
      'site_settings',
      'test_key',
      'Test Setting',
      { previous: 1, current: 2 }
    );

    const result = await adminAuditRepository.getAuditLogs({ search: 'test_key' });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.entity_id).toBe('test_key');
    expect(result.data[0]?.safe_metadata).toEqual({ previous: 1, current: 2 });
  });
});
