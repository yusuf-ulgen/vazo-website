import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  AlertTriangle,
  Building2,
  Mail,
  ExternalLink,
  Volume2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { adminNotificationService } from '../admin-notification-service';
import type { AdminNotification, NotificationType } from '../types';

export function AdminNotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | NotificationType>('all');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    adminNotificationService.getDesktopPermission()
  );
  const [testSent, setTestSent] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const items = await adminNotificationService.fetchNotifications();
      setNotifications(items);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      loadNotifications();
    }, 60000); // 1 minute auto refresh
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRequestPermission = async () => {
    const result = await adminNotificationService.requestDesktopPermission();
    setPermission(result);
    if (result === 'granted') {
      adminNotificationService.sendDesktopNotification('Masaüstü Bildirimleri Aktif Edildi', {
        body: 'Yeni sipariş ve kritik stok bildirimleri artık anında ekranınızda belirecektir.',
      });
    }
  };

  const handleSendTestNotification = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (testSent) return;

    setTestSent(true);
    adminNotificationService.sendDesktopNotification('Monocactus Test Bildirimi', {
      body: 'Masaüstü bildirim sisteminiz sorunsuz çalışıyor!',
      tag: 'monocactus-test-notif',
    });

    setTimeout(() => setTestSent(false), 4000);
  };

  const handleMarkAsRead = (id: string) => {
    adminNotificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    adminNotificationService.markAllAsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case 'stock':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'wholesale':
        return <Building2 className="w-4 h-4 text-indigo-500" />;
      case 'contact':
        return <Mail className="w-4 h-4 text-sky-500" />;
      default:
        return <Bell className="w-4 h-4 text-text-muted" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Az önce';
      if (mins < 60) return `${mins} dk önce`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} sa önce`;
      const days = Math.floor(hours / 24);
      return `${days} gün önce`;
    } catch {
      return '';
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Bildirimler"
        className="p-2 text-text-secondary hover:text-text-primary rounded transition-colors relative cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-feedback-danger rounded-full ring-2 ring-surface-primary animate-pulse" />
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-primary border border-border-default shadow-elevated rounded-lg overflow-hidden z-50 animate-fade-in text-text-primary">
          {/* Header */}
          <div className="p-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-secondary/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Bildirimler</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-feedback-danger text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors cursor-pointer"
                  title="Tümünü Okundu İşaretle"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tümünü Oku</span>
                </button>
              )}
              <button
                type="button"
                onClick={loadNotifications}
                disabled={isLoading}
                className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                title="Yenile"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Desktop Permission Banner */}
          <div className="px-3.5 py-2.5 bg-canvas-warm/80 border-b border-border-subtle text-[11px] flex items-center justify-between gap-2">
            {permission === 'granted' ? (
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Masaüstü bildirimleri aktif
                </span>
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  disabled={testSent}
                  className="text-[10px] uppercase font-semibold text-text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {testSent ? 'Gönderildi ✓' : 'Test Gönder'}
                </button>
              </div>
            ) : permission === 'denied' ? (
              <span className="flex items-center gap-1.5 text-feedback-danger">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                Tarayıcı bildirim izni engellenmiş.
              </span>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Volume2 className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                  Masaüstü bildirimlerini açın
                </span>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2 py-1 text-[10px] font-semibold bg-action-primary text-action-primary-text rounded hover:bg-neutral-800 transition-colors shrink-0"
                >
                  İzin Ver
                </button>
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="p-2 border-b border-border-subtle flex gap-1 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'all'
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              Tümü ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('order')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'order'
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              Siparişler
            </button>
            <button
              type="button"
              onClick={() => setFilter('stock')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'stock'
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              Stok
            </button>
            <button
              type="button"
              onClick={() => setFilter('wholesale')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'wholesale'
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              Toptan
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted">
                Bildirim bulunmuyor.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`p-3 text-xs transition-colors hover:bg-surface-secondary/60 flex items-start gap-3 cursor-pointer ${
                    !n.read ? 'bg-accent-primary/5' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-surface-secondary flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs truncate ${
                          !n.read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-[10px] text-text-muted shrink-0">
                        {formatTimeAgo(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">
                      {n.message}
                    </p>
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-primary hover:underline pt-1"
                      >
                        <span>İncele</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>

                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-feedback-danger shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
