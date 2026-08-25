import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  AdminCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types';
import { generateSlug, validateSlug } from '../api/admin-category-repository';
import { FormField, AdminInput, AdminSelect, AdminTextarea } from '@/admin/ui/FormField';
import { AssetUploadButton } from '@/admin/media/components/AssetUploadButton';

export interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  category?: AdminCategory | null;
  allCategories: AdminCategory[];
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  allCategories,
}: CategoryFormModalProps) {
  const isEditing = Boolean(category);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [active, setActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setParentId(category.parent_id || '');
      setDescription(category.description || '');
      setImageUrl(category.image_url || '');
      setSortOrder(category.sort_order);
      setActive(category.active);
      setSeoTitle(category.seo_title || '');
      setSeoDescription(category.seo_description || '');
    } else {
      setName('');
      setSlug('');
      setParentId('');
      setDescription('');
      setImageUrl('');
      setSortOrder(0);
      setActive(true);
      setSeoTitle('');
      setSeoDescription('');
    }
    setErrorMessage(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing || !slug) {
      setSlug(generateSlug(val));
    }
  };

  const handleGenerateSlug = () => {
    setSlug(generateSlug(name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Kategori adı zorunludur.');
      return;
    }

    const trimmedSlug = slug.trim().toLowerCase();
    if (!validateSlug(trimmedSlug)) {
      setErrorMessage('Geçersiz slug formatı. Sadece küçük harfler, rakamlar ve tire (-) kullanılabilir.');
      return;
    }

    if (isEditing && category && parentId === category.id) {
      setErrorMessage('Bir kategori kendisinin üst kategorisi olamaz.');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: trimmedName,
        slug: trimmedSlug,
        parent_id: parentId ? parentId : null,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        sort_order: Number(sortOrder) || 0,
        active,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Kategori kaydedilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter available parent candidates (exclude current category)
  const availableParents = allCategories.filter((c) => !category || c.id !== category.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs animate-fade-in"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="relative w-full max-w-2xl bg-surface-primary border border-border-default shadow-elevated z-10 p-6 sm:p-8 animate-fade-scale text-left my-8"
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="Kapat"
          className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-text-primary rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <header className="pb-4 border-b border-border-subtle mb-5">
          <h3 id="category-modal-title" className="text-base font-semibold text-text-primary">
            {isEditing ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Katalog ve menülerde görüntülenecek kategori parametrelerini tanımlayın.
          </p>
        </header>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-feedback-danger-surface border border-feedback-danger/30 text-feedback-danger text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Kategori Adı" required htmlFor="category-name">
              <AdminInput
                id="category-name"
                value={name}
                onChange={handleNameChange}
                placeholder="Örn: Masa Üstü Vazolar"
                required
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="URL Uzantısı (Slug)"
              required
              htmlFor="category-slug"
              hint="Benzersiz SEO uyumlu link"
            >
              <div className="relative">
                <AdminInput
                  id="category-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="masa-ustu-vazolar"
                  required
                  disabled={isLoading}
                  className="pr-8"
                />
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  title="İsimden otomatik slug oluştur"
                  aria-label="Otomatik slug oluştur"
                  className="absolute right-2 top-2 p-1 text-text-muted hover:text-text-primary"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Üst Kategori" htmlFor="category-parent" hint="Alt kategori oluşturmak için seçin">
              <AdminSelect
                id="category-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">(Ana Kategori - Üst kategori yok)</option>
                {availableParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </AdminSelect>
            </FormField>

            <FormField label="Sıralama Önceliği" htmlFor="category-sort" hint="Düşük sayılar daha önce listelenir">
              <AdminInput
                id="category-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                disabled={isLoading}
              />
            </FormField>
          </div>

          <FormField label="Kategori Görsel URL" htmlFor="category-image" hint="Katalog vitrin görsel bağlantısı">
            <div className="flex gap-2">
              <AdminInput
                id="category-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                disabled={isLoading}
                className="flex-1"
              />
              <AssetUploadButton
                prefix="categories"
                entityId={category?.id}
                onUploaded={setImageUrl}
                disabled={isLoading}
              />
            </div>
          </FormField>

          <FormField label="Açıklama" htmlFor="category-desc">
            <AdminTextarea
              id="category-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kategori hakkında kısa açıklama..."
              disabled={isLoading}
            />
          </FormField>

          {/* SEO Details */}
          <div className="p-4 bg-surface-secondary/60 border border-border-subtle space-y-3">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Arama Motoru Optimizasyonu (SEO)
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <FormField label="SEO Başlığı" htmlFor="category-seo-title">
                <AdminInput
                  id="category-seo-title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Vazo Studio | Masa Üstü Seramik Vazolar"
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="SEO Açıklaması" htmlFor="category-seo-desc">
                <AdminTextarea
                  id="category-seo-desc"
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="El yapımı stoneware seramik masa üstü vazo koleksiyonu..."
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-border-default text-brand-stone focus:ring-brand-stone"
              />
              <span>Aktif ve Yayında</span>
            </label>
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-muted border border-border-default rounded transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-action-primary text-action-primary-text hover:bg-neutral-800 rounded transition-colors disabled:opacity-50 shadow-xs"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Değişiklikleri Kaydet' : 'Kategori Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
