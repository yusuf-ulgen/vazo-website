import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Tag, CheckCircle2, XCircle, Percent, Calendar } from 'lucide-react';
import type { DiscountCode, CreateDiscountCodeInput, UpdateDiscountCodeInput } from '../types';
import { discountRepository } from '../api/discount-repository';
import { DiscountCodeModal } from '../components/DiscountCodeModal';
import {
  AdminPageHeader,
  DataTable,
  SearchField,
  FilterDropdown,
  StatusBadge,
  ConfirmDialog,
  useToast,
} from '@/admin/ui';

export function AdminDiscountsPage() {
  const { success, error: toastError } = useToast();

  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'category' | 'collection'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(null);

  // Delete states
  const [discountToDelete, setDiscountToDelete] = useState<DiscountCode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeParam =
        statusFilter === 'all' ? 'all' : statusFilter === 'active' ? true : false;
      const data = await discountRepository.getAll({
        search: search.trim() || undefined,
        scope: scopeFilter,
        is_active: activeParam,
      });
      setDiscounts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'İndirim kodları yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [search, scopeFilter, statusFilter]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handleOpenCreate = () => {
    setSelectedDiscount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DiscountCode) => {
    setSelectedDiscount(item);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (input: CreateDiscountCodeInput | UpdateDiscountCodeInput) => {
    if (selectedDiscount) {
      await discountRepository.update(selectedDiscount.id, input);
      success(`"${input.code || selectedDiscount.code}" kuponu başarıyla güncellendi.`);
    } else {
      await discountRepository.create(input as CreateDiscountCodeInput);
      success(`"${input.code}" kuponu başarıyla oluşturuldu.`);
    }
    await fetchDiscounts();
  };

  const handleToggleActive = async (item: DiscountCode) => {
    try {
      const updated = await discountRepository.toggleStatus(item.id, !item.is_active);
      success(
        `"${item.code}" kupon kodu ${updated.is_active ? 'aktif edildi' : 'pasife alındı'}.`
      );
      await fetchDiscounts();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Durum güncellenemedi.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!discountToDelete) return;
    setIsDeleting(true);
    try {
      await discountRepository.delete(discountToDelete.id);
      success(`"${discountToDelete.code}" kupon kodu kalıcı olarak silindi.`);
      setDiscountToDelete(null);
      await fetchDiscounts();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Kupon silinemedi.');
    } finally {
      setIsDeleting(false);
    }
  };

  function formatScopeBadge(item: DiscountCode) {
    if (item.scope === 'all') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">Tüm Ürünler</span>;
    }
    if (item.scope === 'category') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {item.scope_label || 'Kategori'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
        {item.scope_label || 'Koleksiyon'}
      </span>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <AdminPageHeader
        title="İndirim Kodları"
        description="Müşterileriniz için sepet indirim kuponları oluşturun, kullanım kotalarını ve kapsamlarını yönetin."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'İndirim Kodları' },
        ]}
        badge={<StatusBadge status="active" label={`${discounts.length} Kupon`} />}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-action-primary text-action-primary-text hover:bg-neutral-800 rounded transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni İndirim Kodu</span>
          </button>
        }
      />

      <DataTable
        isLoading={isLoading}
        error={error}
        onRetry={fetchDiscounts}
        isEmpty={discounts.length === 0}
        emptyTitle="İndirim kodu bulunamadı"
        emptyDescription={
          search || statusFilter !== 'all' || scopeFilter !== 'all'
            ? 'Arama kriterlerinize uygun indirim kodu bulunamadı.'
            : 'Henüz sisteme eklenmiş bir indirim kodu bulunmuyor.'
        }
        emptyAction={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-action-primary text-action-primary-text rounded transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>İlk Kuponu Oluştur</span>
          </button>
        }
        toolbar={
          <>
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Kupon kodu ara (örn: HOSGELDIN20)..."
              className="w-full sm:w-72"
            />

            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label="Kapsam"
                value={scopeFilter}
                onChange={(val) => setScopeFilter(val as 'all' | 'category' | 'collection')}
                options={[
                  { label: 'Tüm Kapsamlar', value: 'all' },
                  { label: 'Sadece Kategoriler', value: 'category' },
                  { label: 'Sadece Koleksiyonlar', value: 'collection' },
                ]}
              />

              <FilterDropdown
                label="Durum"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
                options={[
                  { label: 'Tüm Durumlar', value: 'all' },
                  { label: 'Aktif Kuponlar', value: 'active' },
                  { label: 'Pasif Kuponlar', value: 'inactive' },
                ]}
              />
            </div>
          </>
        }
      >
        <thead>
          <tr className="border-b border-border-subtle bg-surface-secondary/50 text-text-secondary text-[11px] font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Kupon Kodu</th>
            <th className="py-3 px-4 text-center">İndirim Oranı</th>
            <th className="py-3 px-4">Geçerlilik Kapsamı</th>
            <th className="py-3 px-4 text-center">Kullanım Sayısı</th>
            <th className="py-3 px-4">Son Geçerlilik</th>
            <th className="py-3 px-4 text-center">Durum</th>
            <th className="py-3 px-4 text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-text-primary text-xs">
          {discounts.map((item) => (
            <tr key={item.id} className="hover:bg-surface-secondary/40 transition-colors">
              {/* Kupon Kodu */}
              <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-brand-stone shrink-0" />
                  <span className="tracking-wider text-sm">{item.code}</span>
                </div>
              </td>

              {/* İndirim Oranı */}
              <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">
                <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Percent className="w-3 h-3" />
                  %{item.discount_percentage}
                </span>
              </td>

              {/* Kapsam */}
              <td className="py-3.5 px-4">
                {formatScopeBadge(item)}
              </td>

              {/* Kullanım */}
              <td className="py-3.5 px-4 text-center text-text-secondary font-mono">
                {item.usage_count} {item.usage_limit ? `/ ${item.usage_limit}` : 'adet'}
              </td>

              {/* Son Geçerlilik */}
              <td className="py-3.5 px-4 text-text-muted">
                {item.expires_at ? (
                  <span className="inline-flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.expires_at).toLocaleDateString('tr-TR')}
                  </span>
                ) : (
                  <span className="text-[11px] text-text-muted">Süresiz</span>
                )}
              </td>

              {/* Durum */}
              <td className="py-3.5 px-4 text-center">
                <button
                  type="button"
                  onClick={() => handleToggleActive(item)}
                  title={item.is_active ? 'Pasife al' : 'Aktif et'}
                  className="inline-flex items-center gap-1.5 focus:outline-hidden"
                >
                  {item.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hover:bg-emerald-100">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full border border-border-default hover:bg-surface-muted">
                      <XCircle className="w-3 h-3 text-text-muted" />
                      Pasif
                    </span>
                  )}
                </button>
              </td>

              {/* Eylemler */}
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    title="Düzenle"
                    className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountToDelete(item)}
                    title="Sil"
                    className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      {/* Form Modal */}
      <DiscountCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        discountCode={selectedDiscount}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(discountToDelete)}
        title="İndirim Kodunu Sil"
        message={`"${discountToDelete?.code}" kupon kodunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Kuponu Sil"
        cancelLabel="Vazgeç"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDiscountToDelete(null)}
      />
    </div>
  );
}
