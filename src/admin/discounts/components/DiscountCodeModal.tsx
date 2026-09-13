import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle } from 'lucide-react';
import type { DiscountCode, CreateDiscountCodeInput, UpdateDiscountCodeInput, DiscountScope } from '../types';
import { adminCategoryRepository } from '@/admin/categories/api/admin-category-repository';
import { adminCollectionRepository } from '@/admin/collections/api/admin-collection-repository';
import { FormField, AdminInput, AdminSelect } from '@/admin/ui/FormField';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';

export interface DiscountCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateDiscountCodeInput | UpdateDiscountCodeInput) => Promise<void>;
  discountCode?: DiscountCode | null;
}

export function DiscountCodeModal({
  isOpen,
  onClose,
  onSubmit,
  discountCode,
}: DiscountCodeModalProps) {
  const isEditing = Boolean(discountCode);

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number | ''>(10);
  const [selectedScopeValue, setSelectedScopeValue] = useState<string>('all');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load categories and collections dynamically
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function loadScopeOptions() {
      setIsLoadingOptions(true);
      try {
        const [cats, cols] = await Promise.all([
          adminCategoryRepository.getAllCategories({ active: 'all' }).catch(() => []),
          adminCollectionRepository.getAllCollections({ active: 'all' }).catch(() => []),
        ]);
        if (isMounted) {
          setCategories(cats.map((c) => ({ id: c.id, name: c.name })));
          setCollections(cols.map((col) => ({ id: col.id, name: col.name })));
        }
      } catch (err) {
        console.error('Failed to load scope options', err);
      } finally {
        if (isMounted) setIsLoadingOptions(false);
      }
    }

    loadScopeOptions();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync state when discountCode prop changes
  useEffect(() => {
    if (discountCode) {
      setCode(discountCode.code);
      setDiscountPercentage(discountCode.discount_percentage);
      if (discountCode.scope === 'all') {
        setSelectedScopeValue('all');
      } else if (discountCode.scope_id) {
        setSelectedScopeValue(`${discountCode.scope}:${discountCode.scope_id}`);
      } else {
        setSelectedScopeValue('all');
      }
      setUsageLimit(discountCode.usage_limit ?? '');
      setExpiresAt(discountCode.expires_at ? discountCode.expires_at.slice(0, 16) : '');
      setIsActive(discountCode.is_active);
    } else {
      setCode('');
      setDiscountPercentage(10);
      setSelectedScopeValue('all');
      setUsageLimit('');
      setExpiresAt('');
      setIsActive(true);
    }
    setErrorMessage(null);
  }, [discountCode, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Lütfen geçerli bir indirim kodu girin.');
      return;
    }

    const perc = Number(discountPercentage);
    if (!perc || perc <= 0 || perc > 100) {
      setErrorMessage('İndirim oranı %1 ile %100 arasında olmalıdır.');
      return;
    }

    let scope: DiscountScope = 'all';
    let scopeId: string | null = null;
    let scopeLabel: string | null = null;

    if (selectedScopeValue !== 'all') {
      const [scType, scId] = selectedScopeValue.split(':');
      if (scType === 'category') {
        scope = 'category';
        scopeId = scId || null;
        const matched = categories.find((c) => c.id === scId);
        scopeLabel = matched ? `Kategori: ${matched.name}` : null;
      } else if (scType === 'collection') {
        scope = 'collection';
        scopeId = scId || null;
        const matched = collections.find((col) => col.id === scId);
        scopeLabel = matched ? `Koleksiyon: ${matched.name}` : null;
      }
    }

    const payload: CreateDiscountCodeInput = {
      code: cleanCode,
      discount_percentage: perc,
      scope,
      scope_id: scopeId,
      scope_label: scopeLabel,
      is_active: isActive,
      usage_limit: usageLimit !== '' ? Number(usageLimit) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="discount-modal-title"
        className="w-full max-w-lg bg-surface-primary border border-border-default rounded shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/40">
          <div>
            <h3 id="discount-modal-title" className="text-sm font-semibold text-text-primary">
              {isEditing ? 'İndirim Kodunu Düzenle' : 'Yeni İndirim Kodu Ekle'}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Kupon kodu, indirim yüzdesi ve geçerli olacağı kategoriyi belirleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Kapat"
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Kupon Kodu */}
          <FormField label="Kupon Kodu" htmlFor="discount-code" required hint="Otomatik olarak BÜYÜK harfe dönüştürülür">
            <AdminInput
              id="discount-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              placeholder="Örn: HOSGELDIN20"
              disabled={isSubmitting}
              required
            />
          </FormField>

          {/* İndirim Oranı */}
          <FormField label="İndirim Oranı (%)" htmlFor="discount-percentage" required hint="Sepet tutarına uygulanacak yüzde">
            <AdminInput
              id="discount-percentage"
              type="number"
              min="1"
              max="100"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value ? Number(e.target.value) : '')}
              placeholder="20"
              disabled={isSubmitting}
              required
            />
          </FormField>

          {/* Kapsam (Scope) Dropdown */}
          <FormField
            label="Geçerli Olacağı Kategori / Koleksiyon"
            htmlFor="discount-scope"
            required
            hint="Varsayılan: Tüm Kategoriler ve Koleksiyonlar"
          >
            <AdminSelect
              id="discount-scope"
              value={selectedScopeValue}
              onChange={(e) => setSelectedScopeValue(e.target.value)}
              disabled={isSubmitting || isLoadingOptions}
            >
              <option value="all">Tüm Kategoriler ve Koleksiyonlar (Genel)</option>

              {categories.length > 0 && (
                <optgroup label="── Kategoriler ──">
                  {categories.map((c) => (
                    <option key={`cat-${c.id}`} value={`category:${c.id}`}>
                      Kategori: {c.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {collections.length > 0 && (
                <optgroup label="── Koleksiyonlar ──">
                  {collections.map((col) => (
                    <option key={`col-${col.id}`} value={`collection:${col.id}`}>
                      Koleksiyon: {col.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </AdminSelect>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kullanım Limiti */}
            <FormField label="Kullanım Limiti (Opsiyonel)" htmlFor="discount-limit" hint="Boş bırakılırsa sınırsızdır">
              <AdminInput
                id="discount-limit"
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : '')}
                placeholder="Örn: 100"
                disabled={isSubmitting}
              />
            </FormField>

            {/* Bitiş Tarihi */}
            <FormField label="Son Geçerlilik Tarihi (Opsiyonel)" htmlFor="discount-expiry">
              <AdminInput
                id="discount-expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={isSubmitting}
              />
            </FormField>
          </div>

          {/* Aktiflik Durumu */}
          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 rounded border-border-default text-brand-stone focus:ring-brand-stone"
              />
              <span>Kupon Kodu Aktif (Müşteriler kullanabilir)</span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-muted border border-border-default rounded transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-action-primary text-action-primary-text hover:bg-neutral-800 rounded transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Değişiklikleri Kaydet' : 'Kuponu Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
