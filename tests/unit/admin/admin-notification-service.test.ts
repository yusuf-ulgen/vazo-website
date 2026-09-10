import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminNotificationService } from '@/admin/notifications/admin-notification-service';
import * as supabaseModule from '@/shared/lib/supabase';

describe('adminNotificationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('fetches notifications including contact messages and trade applications', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'orders') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'ord-123',
                    order_number: 'ORD-999',
                    total_amount: 1500,
                    status: 'pending',
                    created_at: '2026-09-10T10:00:00Z',
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'product_variants') {
        return {
          select: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'var-1',
                      sku: 'SKU-LOW',
                      variant_name: 'Antik Beyaz',
                      stock_quantity: 2,
                      products: { name: 'Ege Vazo' },
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'trade_applications') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'app-1',
                      company_name: 'Örnek Mimarlık',
                      contact_person: 'Ali Veli',
                      status: 'pending',
                      submitted_at: '2026-09-10T10:05:00Z',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'contact_messages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'msg-1',
                      name: 'Ziyaretçi Ahmet',
                      subject: 'Özel Sipariş',
                      message: 'Büyük boy vazo siparişi vermek istiyorum.',
                      status: 'new',
                      created_at: '2026-09-10T10:10:00Z',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
      };
    });

    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue({
      from: mockFrom,
    } as unknown as ReturnType<typeof supabaseModule.getSupabase>);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

    const notifications = await adminNotificationService.fetchNotifications();

    expect(notifications.length).toBe(4);

    const contactNotif = notifications.find((n) => n.type === 'contact');
    expect(contactNotif).toBeDefined();
    expect(contactNotif?.title).toContain('Ziyaretçi Ahmet');
    expect(contactNotif?.message).toContain('Özel Sipariş');
    expect(contactNotif?.link).toBe('/admin/submissions');

    const wholesaleNotif = notifications.find((n) => n.type === 'wholesale');
    expect(wholesaleNotif).toBeDefined();
    expect(wholesaleNotif?.title).toContain('Örnek Mimarlık');
    expect(wholesaleNotif?.message).toContain('Ali Veli');
  });

  it('subscribes to realtime events and calls listener callback', () => {
    let insertCallback: ((payload: { new: unknown }) => void) | null = null;

    const mockChannel = {
      on: vi.fn().mockImplementation((_type: string, filter: { table: string }, cb: (payload: { new: unknown }) => void) => {
        if (filter.table === 'contact_messages') {
          insertCallback = cb;
        }
        return mockChannel;
      }),
      subscribe: vi.fn().mockReturnThis(),
    };

    const mockRemoveChannel = vi.fn();

    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue({
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: mockRemoveChannel,
    } as unknown as ReturnType<typeof supabaseModule.getSupabase>);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

    const listener = vi.fn();
    const unsubscribe = adminNotificationService.subscribeToRealtimeEvents(listener);

    expect(mockChannel.subscribe).toHaveBeenCalled();
    expect(insertCallback).toBeDefined();

    // Trigger mock realtime event
    if (insertCallback) {
      (insertCallback as (payload: { new: unknown }) => void)({
        new: {
          id: 'msg-realtime-1',
          name: 'Yeni Müşteri',
          subject: 'Katalog Talebi',
          message: 'Lütfen güncel kataloğu iletin.',
          created_at: '2026-09-10T10:15:00Z',
        },
      });
    }

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'msg-msg-realtime-1',
        type: 'contact',
        title: 'Yeni İletişim Mesajı: Yeni Müşteri',
      })
    );

    unsubscribe();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});
