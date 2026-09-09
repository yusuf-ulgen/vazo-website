import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import type { AdminNotification } from './types';

const READ_NOTIFICATIONS_STORAGE_KEY = 'vazo_admin_read_notifications';

function getReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function markNotificationAsReadInStorage(id: string): void {
  if (typeof window === 'undefined') return;
  const current = getReadNotificationIds();
  current.add(id);
  localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Array.from(current)));
}

function markAllNotificationsAsReadInStorage(ids: string[]): void {
  if (typeof window === 'undefined') return;
  const current = getReadNotificationIds();
  ids.forEach((id) => current.add(id));
  localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Array.from(current)));
}

export const adminNotificationService = {
  /**
   * Fetches latest system events (orders, low stock, B2B applications)
   */
  async fetchNotifications(): Promise<AdminNotification[]> {
    const notifications: AdminNotification[] = [];
    const readIds = getReadNotificationIds();

    if (!isSupabaseConfigured || !supabase) {
      return this.getFallbackNotifications(readIds);
    }

    try {
      // 1. Check Recent Orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      if (orders) {
        for (const ord of orders) {
          const notifId = `ord-${ord.id}`;
          const isPending = ord.status === 'pending';
          notifications.push({
            id: notifId,
            type: 'order',
            title: `Yeni Sipariş: #${ord.order_number || ord.id.slice(0, 8)}`,
            message: `${ord.total_amount ? `₺${Number(ord.total_amount).toLocaleString('tr-TR')} tutarında ` : ''}${isPending ? 'onay bekliyor' : 'sipariş alındı'}.`,
            link: `/admin/orders/${ord.id}`,
            timestamp: ord.created_at,
            read: readIds.has(notifId),
          });
        }
      }

      // 2. Check Low Stock Variants (<= 3)
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, sku, variant_name, stock_quantity, products(name)')
        .lte('stock_quantity', 3)
        .order('stock_quantity', { ascending: true })
        .limit(6);

      if (variants) {
        for (const v of variants) {
          const notifId = `stock-${v.id}-${v.stock_quantity}`;
          const productName = (v.products as unknown as { name?: string })?.name || 'Ürün';
          const isOut = (v.stock_quantity ?? 0) <= 0;
          notifications.push({
            id: notifId,
            type: 'stock',
            title: isOut ? `Stok Tükendi: ${productName}` : `Kritik Stok: ${productName}`,
            message: `${v.variant_name || v.sku} stoğu ${isOut ? 'tükendi (0 adet)' : `${v.stock_quantity} adet kaldı!`}`,
            link: '/admin/inventory',
            timestamp: new Date().toISOString(),
            read: readIds.has(notifId),
          });
        }
      }

      // 3. Check Pending Wholesale Applications
      const { data: applications } = await supabase
        .from('trade_applications')
        .select('id, company_name, contact_name, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (applications) {
        for (const app of applications) {
          const notifId = `app-${app.id}`;
          notifications.push({
            id: notifId,
            type: 'wholesale',
            title: `Yeni Toptan Başvurusu: ${app.company_name}`,
            message: `${app.contact_name} tarafından yapılan başvuru incelemenizi bekliyor.`,
            link: '/admin/submissions',
            timestamp: app.created_at,
            read: readIds.has(notifId),
          });
        }
      }
    } catch (err) {
      console.warn('[adminNotificationService] Fetch error:', err);
    }

    if (notifications.length === 0) {
      return this.getFallbackNotifications(readIds);
    }

    // Sort by timestamp descending
    return notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  getFallbackNotifications(readIds: Set<string>): AdminNotification[] {
    const items: Omit<AdminNotification, 'read'>[] = [
      {
        id: 'sys-welcome',
        type: 'order',
        title: 'Sistem Bildirimi',
        message: 'Monocactus yönetim bildirim servisi aktif.',
        timestamp: new Date().toISOString(),
        link: '/admin',
      },
    ];
    return items.map((i) => ({ ...i, read: readIds.has(i.id) }));
  },

  markAsRead(id: string): void {
    markNotificationAsReadInStorage(id);
  },

  markAllAsRead(notifications: AdminNotification[]): void {
    markAllNotificationsAsReadInStorage(notifications.map((n) => n.id));
  },

  /**
   * Checks browser notification permission status
   */
  getDesktopPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  },

  /**
   * Requests browser desktop notification permission
   */
  async requestDesktopPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Permission request error:', err);
      return Notification.permission;
    }
  },

  /**
   * Triggers a desktop notification if permitted
   */
  sendDesktopNotification(title: string, options?: NotificationOptions): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notif = new Notification(title, {
        icon: '/images/MONOCACTUS.png',
        badge: '/images/MONOCACTUS.png',
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('Desktop notification failed:', err);
      return false;
    }
  },
};
