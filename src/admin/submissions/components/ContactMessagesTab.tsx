import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Trash2, AlertCircle } from 'lucide-react';
import {
  DataTable,
  Pagination,
  StatusBadge,
  ConfirmDialog,
  useToast,
} from '@/admin/ui';
import { adminContactMessagesRepository } from '../api/admin-contact-messages-repository';
import { ContactMessageDetailModal } from './ContactMessageDetailModal';
import type {
  AdminContactMessage,
  ContactMessageStatus,
  UpdateContactMessageInput,
} from '../types';

export function ContactMessagesTab() {
  const { success, error: toastError } = useToast();

  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [statusFilter, setStatusFilter] = useState<'all' | ContactMessageStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedMessage, setSelectedMessage] = useState<AdminContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete Dialog
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminContactMessagesRepository.getContactMessages({
        page,
        pageSize,
        status: statusFilter,
        search: searchQuery,
      });

      setMessages(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Mesajlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleOpenDetail = (msg: AdminContactMessage) => {
    setSelectedMessage(msg);
    setIsModalOpen(true);
  };

  const handleSaveMessage = async (id: string, input: UpdateContactMessageInput) => {
    try {
      await adminContactMessagesRepository.updateContactMessage(id, input);
      success('Güncellendi', 'İletişim mesajı durumu başarıyla kaydedildi.');
      fetchMessages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Güncelleme başarısız oldu.';
      toastError('Hata', msg);
      throw err;
    }
  };

  const handleDeleteMessage = async () => {
    if (!deletingMessageId) return;

    try {
      await adminContactMessagesRepository.deleteContactMessage(deletingMessageId);
      success('Silindi', 'Mesaj kaydı silindi.');
      setDeletingMessageId(null);
      fetchMessages();
    } catch (err: unknown) {
      toastError('Hata', err instanceof Error ? err.message : 'Mesaj silinemedi.');
    }
  };

  const getStatusBadge = (status: ContactMessageStatus) => {
    switch (status) {
      case 'new':
        return <StatusBadge status="warning" label="Yeni" />;
      case 'read':
        return <StatusBadge status="info" label="Okundu" />;
      case 'replied':
        return <StatusBadge status="active" label="Yanıtlandı" />;
      case 'archived':
        return <StatusBadge status="draft" label="Arşiv" />;
      default:
        return <StatusBadge status="draft" label={status} />;
    }
  };

  const statusFilters: { id: 'all' | ContactMessageStatus; label: string }[] = [
    { id: 'all', label: 'Tüm Mesajlar' },
    { id: 'new', label: 'Yeni (İncelenmedi)' },
    { id: 'read', label: 'Okundu' },
    { id: 'replied', label: 'Yanıtlandı' },
    { id: 'archived', label: 'Arşivlendi' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setStatusFilter(f.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                statusFilter === f.id
                  ? 'bg-action-primary text-action-primary-text'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="İsim, e-posta veya konu ara..."
            className="w-full pl-9 pr-3 py-2 bg-surface-primary border border-border-default rounded-md text-xs text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-feedback-error/10 border border-feedback-error/20 text-feedback-error rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchMessages}
            className="underline font-semibold hover:opacity-75"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="space-y-4">
        <DataTable
          isLoading={loading}
          isEmpty={messages.length === 0}
          emptyTitle="Hiç mesaj bulunamadı"
          emptyDescription={
            searchQuery || statusFilter !== 'all'
              ? 'Arama kriterlerinize uygun kayıt bulunmuyor.'
              : 'Henüz iletilen bir iletişim mesajı yok.'
          }
          error={error}
          onRetry={fetchMessages}
        >
          <thead>
            <tr className="bg-surface-secondary/50 border-b border-border-subtle text-text-secondary uppercase text-[11px] font-semibold">
              <th className="py-3 px-4">Tarih</th>
              <th className="py-3 px-4">Gönderen</th>
              <th className="py-3 px-4">Konu</th>
              <th className="py-3 px-4">Durum</th>
              <th className="py-3 px-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-text-primary">
            {messages.map((m) => (
              <tr key={m.id} className="hover:bg-surface-secondary/30 transition-colors">
                <td className="py-3 px-4 whitespace-nowrap text-xs text-text-secondary">
                  {new Date(m.created_at).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-4">
                  <div className="text-left space-y-0.5">
                    <div className="text-xs font-medium text-text-primary">{m.name}</div>
                    <div className="text-[11px] text-text-muted font-mono">{m.email}</div>
                  </div>
                </td>
                <td className="py-3 px-4 max-w-xs truncate text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">{m.subject}</span>
                </td>
                <td className="py-3 px-4">{getStatusBadge(m.status)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(m)}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded transition-colors"
                      title="İncele & Yanıtla"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingMessageId(m.id)}
                      className="p-1.5 text-text-secondary hover:text-feedback-error hover:bg-surface-muted rounded transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Detail Modal */}
      <ContactMessageDetailModal
        message={selectedMessage}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMessage(null);
        }}
        onSave={handleSaveMessage}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingMessageId)}
        title="Mesajı Sil"
        message="Bu iletişim mesajını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        isDestructive
        onConfirm={handleDeleteMessage}
        onCancel={() => setDeletingMessageId(null)}
      />
    </div>
  );
}
