import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { adminVariantRepository } from '@/admin/variants/api/admin-variant-repository';
import { VariantFormModal } from '@/admin/variants/components/VariantFormModal';
import { ConfirmDialog, StatusBadge, useToast } from '@/admin/ui';
import { formatCurrency } from '@/shared/lib/formatters';
import type { AdminProductVariant } from '@/admin/variants/types';

interface ProductFormVariantsTabProps {
  productId?: string;
}

export const ProductFormVariantsTab: React.FC<ProductFormVariantsTabProps> = ({ productId }) => {
  const { success, error: toastError } = useToast();

  const [variants, setVariants] = useState<AdminProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<AdminProductVariant | null>(null);

  const [deletingVariant, setDeletingVariant] = useState<AdminProductVariant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadVariants = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await adminVariantRepository.getVariantsByProductId(productId);
      setVariants(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Varyantlar yüklenemedi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  const handleOpenCreate = () => {
    setEditingVariant(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (variant: AdminProductVariant) => {
    setEditingVariant(variant);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (variant: AdminProductVariant) => {
    try {
      await adminVariantRepository.toggleVariantActive(variant.id, !variant.active);
      success('Varyant Güncellendi', `"${variant.sku}" durumu güncellendi.`);
      loadVariants();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Durum güncellenemedi.';
      toastError('Hata', msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVariant) return;

    setIsDeleting(true);
    try {
      await adminVariantRepository.deleteVariant(deletingVariant.id);
      success('Varyant Silindi', `"${deletingVariant.sku}" kaldırıldı.`);
      setDeletingVariant(null);
      loadVariants();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Varyant silinemedi.';
      toastError('Hata', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!productId) {
    return (
      <div className="p-6 text-center text-xs text-text-muted bg-surface-secondary/40 rounded-lg border border-border-subtle">
        Varyant (SKU) eklemek için önce ürünü oluşturunuz.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-text-primary block">
            Ürün Varyantları ({variants.length})
          </span>
          <span className="text-[11px] text-text-muted">
            SKU bazlı renk, boyut, ağırlık ve stok miktarları.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadVariants}
            disabled={isLoading}
            className="p-1.5 rounded border border-border-default text-text-secondary hover:text-text-primary transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-accent-primary text-text-inverse hover:bg-accent-primary/90 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Varyant Ekle
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 bg-feedback-error/10 border border-feedback-error/20 rounded text-feedback-error text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {variants.length === 0 && !isLoading ? (
        <div className="p-6 text-center border border-dashed border-border-default rounded-lg text-xs text-text-muted">
          Bu ürüne ait henüz varyant bulunmuyor.
        </div>
      ) : (
        <div className="border border-border-subtle rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/50 border-b border-border-subtle text-text-secondary text-[11px] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">SKU / Varyant</th>
                <th className="py-2.5 px-3">Renk & Boyut</th>
                <th className="py-2.5 px-3">Fiyat</th>
                <th className="py-2.5 px-3">Stok</th>
                <th className="py-2.5 px-3">Durum</th>
                <th className="py-2.5 px-3 text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-text-primary">
              {variants.map((variant) => (
                <tr key={variant.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-semibold text-text-primary block">{variant.sku}</span>
                    <span className="text-[11px] text-text-secondary">{variant.variant_name}</span>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      {variant.color_hex && (
                        <span
                          className="w-3 h-3 rounded-full border border-border-default shrink-0 inline-block"
                          style={{ backgroundColor: variant.color_hex }}
                        />
                      )}
                      <span>{variant.color_name}</span>
                    </div>
                    {variant.size_label && (
                      <span className="text-[10px] text-text-muted block mt-0.5">{variant.size_label}</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 font-mono">
                    <span className="font-semibold">{formatCurrency(variant.retail_price)}</span>
                    {variant.compare_at_price && (
                      <span className="text-[10px] text-text-muted line-through block">
                        {formatCurrency(variant.compare_at_price)}
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`font-mono font-medium ${
                        variant.stock_quantity === 0
                          ? 'text-feedback-error'
                          : variant.stock_quantity <= 5
                          ? 'text-feedback-warning'
                          : 'text-text-primary'
                      }`}
                    >
                      {variant.stock_quantity} Adet
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    <StatusBadge
                      status={variant.active ? 'active' : 'inactive'}
                      label={variant.active ? 'Aktif' : 'Pasif'}
                    />
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(variant)}
                        title={variant.active ? 'Pasife Al' : 'Aktife Al'}
                        className="p-1 text-text-secondary hover:text-text-primary rounded transition-colors"
                      >
                        {variant.active ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-text-muted" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(variant)}
                        title="Düzenle"
                        className="p-1 text-text-secondary hover:text-text-primary rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingVariant(variant)}
                        title="Sil"
                        className="p-1 text-feedback-error/80 hover:text-feedback-error rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Variant Create/Edit Modal */}
      <VariantFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadVariants}
        productId={productId}
        initialData={editingVariant}
      />

      {/* Variant Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingVariant)}
        onCancel={() => setDeletingVariant(null)}
        onConfirm={handleDeleteConfirm}
        title="Varyantı Sil"
        message={`"${deletingVariant?.sku}" kodlu varyantı kalıcı olarak silmek istediğinizden emin misiniz? Bu varyanta bağlı toptan kademe fiyatları da silinecektir.`}
        confirmLabel="Varyantı Sil"
        cancelLabel="Vazgeç"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
