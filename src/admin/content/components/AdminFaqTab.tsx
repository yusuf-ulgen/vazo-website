import { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { adminFaqRepository } from '../api/admin-faq-repository';
import { FaqGroupModal } from './FaqGroupModal';
import { FaqItemModal } from './FaqItemModal';
import { ConfirmDialog } from '@/admin/ui';
import type {
  AdminFaqGroup,
  AdminFaqItem,
  CreateFaqGroupInput,
  UpdateFaqGroupInput,
  CreateFaqItemInput,
  UpdateFaqItemInput,
} from '../types';

export function AdminFaqTab() {
  const [groups, setGroups] = useState<AdminFaqGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Group modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminFaqGroup | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Item modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AdminFaqItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminFaqRepository.getFaqGroups();
      setGroups(data);
      // Auto expand all groups
      const initExp: Record<string, boolean> = {};
      data.forEach((g) => {
        initExp[g.id] = true;
      });
      setExpandedGroups((prev) => (Object.keys(prev).length === 0 ? initExp : prev));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'FAQ grupları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Group operations
  const handleSaveGroup = async (
    input: CreateFaqGroupInput | UpdateFaqGroupInput,
    groupId?: string
  ) => {
    if (groupId) {
      await adminFaqRepository.updateFaqGroup(groupId, input as UpdateFaqGroupInput);
      showFeedback('FAQ kategorisi güncellendi.');
    } else {
      await adminFaqRepository.createFaqGroup(input as CreateFaqGroupInput);
      showFeedback('Yeni FAQ kategorisi eklendi.');
    }
    await fetchFaqs();
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroupId) return;
    try {
      await adminFaqRepository.deleteFaqGroup(deletingGroupId);
      showFeedback('FAQ kategorisi ve alt soruları silindi.');
      setDeletingGroupId(null);
      await fetchFaqs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kategori silinemedi.');
    }
  };

  const handleToggleGroupActive = async (group: AdminFaqGroup) => {
    try {
      await adminFaqRepository.updateFaqGroup(group.id, { active: !group.active });
      await fetchFaqs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi.');
    }
  };

  const handleMoveGroup = async (group: AdminFaqGroup, direction: 'up' | 'down') => {
    const sorted = [...groups].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((g) => g.id === group.id);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];
    if (!current || !target) return;

    const currentSort = current.sort_order;
    const targetSort = target.sort_order;

    try {
      await adminFaqRepository.reorderFaqGroups([
        { id: current.id, sort_order: targetSort },
        { id: target.id, sort_order: currentSort },
      ]);
      await fetchFaqs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sıralama güncellenemedi.');
    }
  };

  // Item operations
  const handleSaveItem = async (
    input: CreateFaqItemInput | UpdateFaqItemInput,
    itemId?: string
  ) => {
    if (itemId) {
      await adminFaqRepository.updateFaqItem(itemId, input as UpdateFaqItemInput);
      showFeedback('FAQ sorusu güncellendi.');
    } else {
      await adminFaqRepository.createFaqItem(input as CreateFaqItemInput);
      showFeedback('Yeni FAQ sorusu eklendi.');
    }
    await fetchFaqs();
  };

  const handleDeleteItem = async () => {
    if (!deletingItemId) return;
    try {
      await adminFaqRepository.deleteFaqItem(deletingItemId);
      showFeedback('FAQ sorusu silindi.');
      setDeletingItemId(null);
      await fetchFaqs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Soru silinemedi.');
    }
  };

  const handleToggleItemActive = async (item: AdminFaqItem) => {
    try {
      await adminFaqRepository.updateFaqItem(item.id, { active: !item.active });
      await fetchFaqs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi.');
    }
  };

  const handleMoveItem = async (group: AdminFaqGroup, item: AdminFaqItem, direction: 'up' | 'down') => {
    if (!group.items) return;
    const sorted = [...group.items].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((i) => i.id === item.id);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];
    if (!current || !target) return;

    const currentSort = current.sort_order;
    const targetSort = target.sort_order;

    try {
      await adminFaqRepository.reorderFaqItems([
        { id: current.id, sort_order: targetSort },
        { id: target.id, sort_order: currentSort },
      ]);
      await fetchFaqs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sıralama güncellenemedi.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3 bg-feedback-success/10 border border-feedback-success/20 text-feedback-success rounded-md text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 text-feedback-error rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Sıkça Sorulan Sorular Yönetimi
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Müşteri destek, kargo, seramik bakımı ve toptan satış SSS içeriklerini düzenleyin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingGroup(null);
            setIsGroupModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-action-primary hover:bg-neutral-800 text-action-primary-text text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yeni Kategori Ekle</span>
        </button>
      </div>

      {loading && groups.length === 0 ? (
        <div className="p-12 text-center text-text-muted flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>FAQ verileri yükleniyor...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="p-8 text-center bg-surface-secondary/40 border border-dashed border-border-default rounded-xl text-text-muted text-xs">
          Henüz bir FAQ kategorisi oluşturulmamış. "Yeni Kategori Ekle" butonuna tıklayarak başlayabilirsiniz.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, grpIdx) => {
            const isExpanded = expandedGroups[group.id] ?? true;
            return (
              <div
                key={group.id}
                className="bg-surface-primary border border-border-subtle rounded-xl overflow-hidden shadow-xs"
              >
                {/* Group Header Bar */}
                <div className="p-4 bg-surface-secondary/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleGroupExpand(group.id)}
                      className="p-1 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <span className="w-6 h-6 rounded-full bg-surface-muted text-text-secondary flex items-center justify-center text-xs font-mono font-medium shrink-0">
                      {group.sort_order}
                    </span>
                    <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <span>{group.title}</span>
                      <span className="text-xs font-normal text-text-muted font-mono">
                        ({group.items?.length || 0} soru)
                      </span>
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleGroupActive(group)}
                      className={`p-1.5 rounded text-xs font-medium transition-colors ${
                        group.active
                          ? 'text-feedback-success hover:bg-feedback-success/10'
                          : 'text-text-muted hover:bg-surface-muted'
                      }`}
                      title={group.active ? 'Kategori Aktif' : 'Kategori Pasif'}
                    >
                      {group.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Reorder buttons */}
                    <button
                      type="button"
                      disabled={grpIdx === 0}
                      onClick={() => handleMoveGroup(group, 'up')}
                      className="p-1.5 text-text-secondary hover:text-text-primary disabled:opacity-30 rounded hover:bg-surface-muted transition-colors"
                      title="Yukarı Taşı"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={grpIdx === groups.length - 1}
                      onClick={() => handleMoveGroup(group, 'down')}
                      className="p-1.5 text-text-secondary hover:text-text-primary disabled:opacity-30 rounded hover:bg-surface-muted transition-colors"
                      title="Aşağı Taşı"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>

                    {/* Add Item to this group */}
                    <button
                      type="button"
                      onClick={() => {
                        setTargetGroupId(group.id);
                        setEditingItem(null);
                        setIsItemModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-surface-primary hover:bg-surface-muted border border-border-default rounded text-xs font-semibold text-text-primary transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Soru Ekle</span>
                    </button>

                    {/* Edit group */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGroup(group);
                        setIsGroupModalOpen(true);
                      }}
                      className="p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-surface-muted transition-colors"
                      title="Kategoriyi Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete group */}
                    <button
                      type="button"
                      onClick={() => setDeletingGroupId(group.id)}
                      className="p-1.5 text-feedback-error hover:bg-feedback-error/10 rounded transition-colors"
                      title="Kategoriyi Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Group Items Accordion Body */}
                {isExpanded && (
                  <div>
                    {(!group.items || group.items.length === 0) ? (
                      <div className="p-6 text-center text-text-muted text-xs">
                        Bu kategoride henüz soru bulunmuyor. "Soru Ekle" butonunu kullanarak ekleyebilirsiniz.
                      </div>
                    ) : (
                      <div className="divide-y divide-border-subtle">
                        {group.items.map((item, itemIdx) => (
                          <div
                            key={item.id}
                            className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-surface-secondary/20 transition-colors"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <HelpCircle className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <h5 className="text-xs sm:text-sm font-semibold text-text-primary">
                                  {item.question}
                                </h5>
                                <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
                                  {item.answer}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                              {/* Item Active */}
                              <button
                                type="button"
                                onClick={() => handleToggleItemActive(item)}
                                className={`p-1.5 rounded text-xs font-medium transition-colors ${
                                  item.active
                                    ? 'text-feedback-success hover:bg-feedback-success/10'
                                    : 'text-text-muted hover:bg-surface-muted'
                                }`}
                                title={item.active ? 'Soru Aktif' : 'Soru Pasif'}
                              >
                                {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>

                              {/* Item Move */}
                              <button
                                type="button"
                                disabled={itemIdx === 0}
                                onClick={() => handleMoveItem(group, item, 'up')}
                                className="p-1.5 text-text-secondary hover:text-text-primary disabled:opacity-30 rounded hover:bg-surface-muted transition-colors"
                                title="Yukarı Taşı"
                              >
                                <MoveUp className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                disabled={itemIdx === (group.items?.length || 0) - 1}
                                onClick={() => handleMoveItem(group, item, 'down')}
                                className="p-1.5 text-text-secondary hover:text-text-primary disabled:opacity-30 rounded hover:bg-surface-muted transition-colors"
                                title="Aşağı Taşı"
                              >
                                <MoveDown className="w-4 h-4" />
                              </button>

                              {/* Item Edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetGroupId(group.id);
                                  setEditingItem(item);
                                  setIsItemModalOpen(true);
                                }}
                                className="p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-surface-muted transition-colors"
                                title="Soruyu Düzenle"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Item Delete */}
                              <button
                                type="button"
                                onClick={() => setDeletingItemId(item.id)}
                                className="p-1.5 text-feedback-error hover:bg-feedback-error/10 rounded transition-colors"
                                title="Soruyu Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Group Modal */}
      <FaqGroupModal
        group={editingGroup}
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleSaveGroup}
      />

      {/* Item Modal */}
      {targetGroupId && (
        <FaqItemModal
          groupId={targetGroupId}
          item={editingItem}
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItem}
        />
      )}

      {/* Delete Group Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingGroupId)}
        title="FAQ Kategorisini Sil"
        message="Bu kategoriyi ve içindeki tüm soruları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        isDestructive
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeletingGroupId(null)}
      />

      {/* Delete Item Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingItemId)}
        title="FAQ Sorusunu Sil"
        message="Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        isDestructive
        onConfirm={handleDeleteItem}
        onCancel={() => setDeletingItemId(null)}
      />
    </div>
  );
}
