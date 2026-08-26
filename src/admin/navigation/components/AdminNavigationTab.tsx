import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Flame,
  LayoutGrid,
} from 'lucide-react';
import { StatusBadge, ConfirmDialog, useToast } from '@/admin/ui';
import { adminNavigationRepository } from '../api/admin-navigation-repository';
import { MenuGroupModal } from './MenuGroupModal';
import { MenuItemModal } from './MenuItemModal';
import type { AdminMenuGroup, AdminMenuItem, MenuType } from '../types';

const MENU_TYPE_LABELS: Record<MenuType, string> = {
  retail_mega: 'Perakende Mega Menü',
  wholesale_mega: 'Toptan Mega Menü',
  primary: 'Ana Gezinme (Desktop/Mobil)',
  footer: 'Altbilgi (Footer)',
};

export function AdminNavigationTab() {
  const { success, error: toastError } = useToast();

  const [selectedType, setSelectedType] = useState<MenuType | 'all'>('all');
  const [groups, setGroups] = useState<AdminMenuGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Group modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminMenuGroup | null>(null);

  // Item modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemTargetGroupId, setItemTargetGroupId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null);

  // Deletion dialogs
  const [deletingGroup, setDeletingGroup] = useState<AdminMenuGroup | null>(null);
  const [deletingItem, setDeletingItem] = useState<AdminMenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const typeFilter = selectedType === 'all' ? undefined : selectedType;
      const data = await adminNavigationRepository.getMenuGroups(typeFilter);
      setGroups(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Menü verileri yüklenemedi.';
      toastError('Hata', msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleGroupActive = async (group: AdminMenuGroup) => {
    try {
      await adminNavigationRepository.updateMenuGroup(group.id, { active: !group.active });
      success('Başarılı', `Grup ${!group.active ? 'aktif' : 'pasif'} edildi.`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Durum güncellenemedi.';
      toastError('Hata', msg);
    }
  };

  const handleToggleItemActive = async (item: AdminMenuItem) => {
    try {
      await adminNavigationRepository.updateMenuItem(item.id, { active: !item.active });
      success('Başarılı', `Bağlantı ${!item.active ? 'aktif' : 'pasif'} edildi.`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Durum güncellenemedi.';
      toastError('Hata', msg);
    }
  };

  const handleDeleteGroupConfirm = async () => {
    if (!deletingGroup) return;
    setIsDeleting(true);
    try {
      await adminNavigationRepository.deleteMenuGroup(deletingGroup.id);
      success('Başarılı', 'Menü grubu silindi.');
      setDeletingGroup(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Silinemedi.';
      toastError('Hata', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteItemConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await adminNavigationRepository.deleteMenuItem(deletingItem.id);
      success('Başarılı', 'Menü bağlantısı silindi.');
      setDeletingItem(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Silinemedi.';
      toastError('Hata', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-primary border border-border-default rounded-lg">
        {/* Menu Type Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-neutral-900 text-neutral-100 font-semibold'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Tümü
          </button>
          {(['retail_mega', 'wholesale_mega', 'primary', 'footer'] as MenuType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                selectedType === t
                  ? 'bg-neutral-900 text-neutral-100 font-semibold'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {MENU_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded border border-border-default bg-surface-primary text-text-secondary hover:text-text-primary transition-colors"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingGroup(null);
              setIsGroupModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Menü Grubu</span>
          </button>
        </div>
      </div>

      {/* Group Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-text-muted text-xs bg-surface-primary border border-border-default rounded-lg">
          Menü yapılandırması yükleniyor...
        </div>
      ) : groups.length === 0 ? (
        <div className="p-12 text-center bg-surface-primary border border-border-default rounded-lg space-y-3">
          <LayoutGrid className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-sm font-semibold text-text-primary">Kayıtlı Menü Grubu Bulunamadı</p>
          <p className="text-xs text-text-secondary">
            Yeni bir menü grubu ekleyerek gezinme hiyerarşisini oluşturabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-surface-primary border border-border-default rounded-lg overflow-hidden shadow-xs text-left"
            >
              {/* Group Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border-default bg-surface-secondary/40">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-0.5 bg-surface-secondary rounded border border-border-subtle text-text-secondary">
                    #{group.sort_order}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-text-primary">{group.title}</h4>
                      <StatusBadge
                        status={group.active ? 'published' : 'archived'}
                        label={group.active ? 'Yayında' : 'Pasif'}
                      />
                      <span className="text-[11px] px-2 py-0.5 rounded bg-surface-muted text-text-secondary font-medium">
                        {MENU_TYPE_LABELS[group.menu_type]}
                      </span>
                    </div>
                    {group.promo_title && (
                      <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-accent-primary" />
                        <span>Promosyon: {group.promo_title}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setItemTargetGroupId(group.id);
                      setEditingItem(null);
                      setIsItemModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-border-default bg-surface-primary text-text-primary hover:bg-surface-secondary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bağlantı Ekle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleGroupActive(group)}
                    className="p-1.5 rounded border border-border-default bg-surface-primary text-text-secondary hover:text-text-primary transition-colors"
                    title={group.active ? 'Pasife Al' : 'Yayına Al'}
                  >
                    {group.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroup(group);
                      setIsGroupModalOpen(true);
                    }}
                    className="p-1.5 rounded border border-border-default bg-surface-primary text-text-secondary hover:text-text-primary transition-colors"
                    title="Grubu Düzenle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingGroup(group)}
                    className="p-1.5 rounded border border-border-default bg-surface-primary text-feedback-danger hover:bg-feedback-danger/10 transition-colors"
                    title="Grubu Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items List Table */}
              <div className="p-4">
                {(!group.items || group.items.length === 0) ? (
                  <p className="text-xs text-text-muted py-4 text-center">
                    Bu grupta henüz bağlantı bulunmuyor. "+ Bağlantı Ekle" butonunu kullanarak ekleyebilirsiniz.
                  </p>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2.5 px-2 hover:bg-surface-secondary/30 transition-colors rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-text-muted w-6 text-center">
                            #{item.sort_order}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-text-primary">{item.label}</span>
                              {item.is_new && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-surface-muted text-text-secondary px-1.5 py-0.5 rounded">
                                  <Sparkles className="w-2.5 h-2.5 text-accent-primary" />
                                  YENİ
                                </span>
                              )}
                              {item.is_popular && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                  <Flame className="w-2.5 h-2.5" />
                                  POPÜLER
                                </span>
                              )}
                              {!item.active && (
                                <span className="text-[10px] bg-surface-muted text-text-muted px-1.5 py-0.5 rounded">
                                  Pasif
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted flex items-center gap-1">
                              <span>{item.href}</span>
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleItemActive(item)}
                            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                            title={item.active ? 'Pasife Al' : 'Yayına Al'}
                          >
                            {item.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setItemTargetGroupId(group.id);
                              setEditingItem(item);
                              setIsItemModalOpen(true);
                            }}
                            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            className="p-1 rounded text-text-muted hover:text-feedback-danger hover:bg-feedback-danger/10 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Modal */}
      <MenuGroupModal
        isOpen={isGroupModalOpen}
        group={editingGroup}
        defaultMenuType={selectedType === 'all' ? 'retail_mega' : selectedType}
        onClose={() => setIsGroupModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Item Modal */}
      {itemTargetGroupId && (
        <MenuItemModal
          isOpen={isItemModalOpen}
          groupId={itemTargetGroupId}
          item={editingItem}
          onClose={() => {
            setIsItemModalOpen(false);
            setItemTargetGroupId(null);
          }}
          onSuccess={loadData}
        />
      )}

      {/* Delete Group Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingGroup)}
        title="Menü Grubunu Sil"
        message={`"${deletingGroup?.title}" grubunu ve altındaki tüm bağlantıları silmek istediğinizden emin misiniz?`}
        confirmLabel="Grubu Sil"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteGroupConfirm}
        onCancel={() => setDeletingGroup(null)}
      />

      {/* Delete Item Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        title="Menü Bağlantısını Sil"
        message={`"${deletingItem?.label}" bağlantısını silmek istediğinizden emin misiniz?`}
        confirmLabel="Bağlantıyı Sil"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteItemConfirm}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
