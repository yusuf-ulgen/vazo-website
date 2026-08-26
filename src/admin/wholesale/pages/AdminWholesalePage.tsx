import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, RefreshCw, Layers } from 'lucide-react';
import {
  AdminPageHeader,
  DataTable,
  FilterDropdown,
  StatusBadge,
  ConfirmDialog,
  useToast,
} from '@/admin/ui';
import { adminWholesaleRepository } from '../api/admin-wholesale-repository';
import { adminProductRepository } from '@/admin/products/api/admin-product-repository';
import { WholesaleTierModal } from '../components/WholesaleTierModal';
import { formatCurrency } from '@/shared/lib/formatters';
import type { AdminWholesaleTier } from '../types';
import type { AdminProduct } from '@/admin/products/types';

export const AdminWholesalePage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [tiers, setTiers] = useState<AdminWholesaleTier[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productFilter, setProductFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<AdminWholesaleTier | null>(null);

  const [deletingTier, setDeletingTier] = useState<AdminWholesaleTier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const result = await adminProductRepository.getProducts({
        page: 1,
        pageSize: 100,
        wholesaleEnabled: true,
      });
      setProducts(result.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Toptan ürünler yüklenemedi:', msg);
    }
  }, []);

  const loadTiers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await adminWholesaleRepository.getWholesaleTiers(
        productFilter !== 'all' ? productFilter : undefined
      );
      setTiers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Toptan fiyat kademeleri yüklenemedi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [productFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  const handleOpenCreate = () => {
    setEditingTier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tier: AdminWholesaleTier) => {
    setEditingTier(tier);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTier) return;

    setIsDeleting(true);
    try {
      await adminWholesaleRepository.deleteWholesaleTier(deletingTier.id);
      success('Kademe Silindi', 'Toptan fiyat kademesi başarıyla kaldırıldı.');
      setDeletingTier(null);
      loadTiers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kademe silinemedi.';
      toastError('Hata', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const productOptions = [
    { value: 'all', label: 'Tüm Toptan Ürünler' },
    ...products.map((p) => ({
      value: p.id,
      label: p.name,
    })),
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="B2B & Toptan Yönetimi"
        description="Kurumsal ve toptan alıcılar için kademeli birim fiyatlandırma (Tier Pricing), MOQ ve hacim indirimleri."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadTiers}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-accent-primary text-text-inverse hover:bg-accent-primary/90 text-xs font-medium transition-colors shadow-subtle"
            >
              <Plus className="w-4 h-4" />
              Yeni Kademe Ekle
            </button>
          </div>
        }
      />

      <div className="bg-surface-secondary/40 border border-border-subtle p-3.5 rounded-lg text-xs text-text-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-accent-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary block">Kademe Fiyatlandırma Sistemi</span>
            <span>
              Toptan alıcılar sepette belirttikleri adet aralığına göre otomatik olarak tanımlı birim fiyattan yararlanır.
            </span>
          </div>
        </div>
        <Link
          to="/admin/submissions?tab=trade"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-primary hover:bg-surface-secondary border border-border-default rounded text-xs font-semibold text-text-primary transition-colors shrink-0 shadow-xs"
        >
          <span>Gelen Trade Başvuruları</span>
          <span className="text-text-muted">&rarr;</span>
        </Link>
      </div>

      <DataTable
        isLoading={isLoading}
        isEmpty={tiers.length === 0}
        emptyTitle="Toptan fiyat kademesi bulunamadı"
        emptyDescription="Herhangi bir toptan fiyat kademesi bulunamadı."
        error={errorMessage}
        onRetry={loadTiers}
        toolbar={
          <FilterDropdown
            label="Ürüne Göre Filtrele"
            value={productFilter}
            onChange={(val) => setProductFilter(val)}
            options={productOptions}
          />
        }
      >
        <thead>
          <tr className="bg-surface-secondary/50 border-b border-border-subtle text-text-secondary uppercase text-[11px] font-semibold">
            <th className="py-3 px-4">Bağlı Ürün / Model</th>
            <th className="py-3 px-4">Min. Adet</th>
            <th className="py-3 px-4">Maks. Adet</th>
            <th className="py-3 px-4">Birim Fiyat</th>
            <th className="py-3 px-4">İndirim Oranı</th>
            <th className="py-3 px-4">Durum</th>
            <th className="py-3 px-4 text-right">Eylemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-text-primary">
          {tiers.map((tier) => (
            <tr key={tier.id} className="hover:bg-surface-secondary/30 transition-colors">
              <td className="py-3 px-4">
                <span className="font-semibold text-text-primary block">{tier.product_name}</span>
                {tier.variant_sku && (
                  <span className="font-mono text-[11px] text-text-muted block mt-0.5">
                    Varyant: {tier.variant_sku} ({tier.variant_name})
                  </span>
                )}
              </td>

              <td className="py-3 px-4 font-mono font-medium">{tier.min_quantity} Adet</td>

              <td className="py-3 px-4 font-mono font-medium">
                {tier.max_quantity !== null ? `${tier.max_quantity} Adet` : 'Sınırsız (ve üzeri)'}
              </td>

              <td className="py-3 px-4 font-mono font-bold text-text-primary">
                {formatCurrency(tier.unit_price)}
              </td>

              <td className="py-3 px-4 font-mono">
                {tier.discount_percentage !== null ? `%{tier.discount_percentage}` : '—'}
              </td>

              <td className="py-3 px-4">
                <StatusBadge
                  status={tier.active ? 'active' : 'inactive'}
                  label={tier.active ? 'Aktif' : 'Pasif'}
                />
              </td>

              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tier)}
                    className="p-1.5 text-text-secondary hover:text-text-primary rounded transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingTier(tier)}
                    className="p-1.5 text-feedback-error/80 hover:text-feedback-error rounded transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <WholesaleTierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadTiers}
        products={products}
        tier={editingTier}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingTier)}
        onCancel={() => setDeletingTier(null)}
        onConfirm={handleDeleteConfirm}
        title="Toptan Fiyat Kademesini Sil"
        message={`"${deletingTier?.product_name}" ürününe ait ${deletingTier?.min_quantity}+ adet kademe fiyatını kalıcı olarak silmek istediğinizden emin misiniz?`}
        confirmLabel="Kademeyi Sil"
        cancelLabel="Vazgeç"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
