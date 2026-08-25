import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  AdminCollection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '../types';
import { generateSlug, validateSlug } from '@/admin/categories/api/admin-category-repository';
import { FormField, AdminInput, AdminTextarea } from '@/admin/ui/FormField';

export interface CollectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCollectionInput | UpdateCollectionInput) => Promise<void>;
  collection?: AdminCollection | null;
}

export function CollectionFormModal({
  isOpen,
  onClose,
  onSubmit,
  collection,
}: CollectionFormModalProps) {
  const isEditing = Boolean(collection);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [storyMarkdown, setStoryMarkdown] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setSlug(collection.slug);
      setSubtitle(collection.subtitle || '');
      setDescription(collection.description || '');
      setStoryMarkdown(collection.story_markdown || '');
      setHeroImageUrl(collection.hero_image_url || '');
      setSortOrder(collection.sort_order);
      setFeatured(collection.featured);
      setActive(collection.active);
      setSeoTitle(collection.seo_title || '');
      setSeoDescription(collection.seo_description || '');
    } else {
      setName('');
      setSlug('');
      setSubtitle('');
      setDescription('');
      setStoryMarkdown('');
      setHeroImageUrl('');
      setSortOrder(0);
      setFeatured(false);
      setActive(true);
      setSeoTitle('');
      setSeoDescription('');
    }
    setErrorMessage(null);
  }, [collection, isOpen]);

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
      setErrorMessage('Koleksiyon adı zorunludur.');
      return;
    }

    const trimmedSlug = slug.trim().toLowerCase();
    if (!validateSlug(trimmedSlug)) {
      setErrorMessage('Geçersiz slug formatı. Sadece küçük harfler, rakamlar ve tire (-) kullanılabilir.');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: trimmedName,
        slug: trimmedSlug,
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        story_markdown: storyMarkdown.trim() || null,
        hero_image_url: heroImageUrl.trim() || null,
        sort_order: Number(sortOrder) || 0,
        featured,
        active,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Koleksiyon kaydedilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

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
        aria-labelledby="collection-modal-title"
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
          <h3 id="collection-modal-title" className="text-base font-semibold text-text-primary">
            {isEditing ? 'Koleksiyonu Düzenle' : 'Yeni Koleksiyon Ekle'}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Sezonluk kürasyonlar, koleksiyon hikayeleri ve vitrin ayarlarını yapılandırın.
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
            <FormField label="Koleksiyon Adı" required htmlFor="collection-name">
              <AdminInput
                id="collection-name"
                value={name}
                onChange={handleNameChange}
                placeholder="Örn: Nordik Sessizlik Serisi"
                required
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="URL Uzantısı (Slug)"
              required
              htmlFor="collection-slug"
              hint="Benzersiz SEO uyumlu link"
            >
              <div className="relative">
                <AdminInput
                  id="collection-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="nordik-sessizlik"
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
            <FormField label="Alt Başlık" htmlFor="collection-subtitle" hint="Katalog kartlarında gösterilen özet">
              <AdminInput
                id="collection-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Yumuşak kavisler ve mineral mat sırlı yüzeyler"
                disabled={isLoading}
              />
            </FormField>

            <FormField label="Sıralama Önceliği" htmlFor="collection-sort" hint="Düşük sayılar daha önce listelenir">
              <AdminInput
                id="collection-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                disabled={isLoading}
              />
            </FormField>
          </div>

          <FormField label="Hero Banner Görsel URL" htmlFor="collection-hero" hint="Koleksiyon detay sayfası kapak görseli">
            <AdminInput
              id="collection-hero"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://..."
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Kısa Açıklama" htmlFor="collection-desc">
            <AdminTextarea
              id="collection-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Koleksiyon hakkında kısa tanıtım metni..."
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Editoryal Hikaye (Markdown)" htmlFor="collection-story" hint="Koleksiyon detay sayfasında yer alacak kürasyon hikayesi">
            <AdminTextarea
              id="collection-story"
              rows={4}
              value={storyMarkdown}
              onChange={(e) => setStoryMarkdown(e.target.value)}
              placeholder="Kuzey doğasının sakinliğinden ve ham taş dokularından ilham alan..."
              disabled={isLoading}
            />
          </FormField>

          {/* SEO Details */}
          <div className="p-4 bg-surface-secondary/60 border border-border-subtle space-y-3">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Arama Motoru Optimizasyonu (SEO)
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <FormField label="SEO Başlığı" htmlFor="collection-seo-title">
                <AdminInput
                  id="collection-seo-title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Vazo Studio | Nordik Sessizlik Koleksiyonu"
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="SEO Açıklaması" htmlFor="collection-seo-desc">
                <AdminTextarea
                  id="collection-seo-desc"
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Doğal mineral sırlarla üretilen sınırlı üretim seramik koleksiyonu..."
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-border-default text-brand-stone focus:ring-brand-stone"
              />
              <span>Ana Sayfada Öne Çıkar (Vitrin)</span>
            </label>

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
              <span>{isEditing ? 'Değişiklikleri Kaydet' : 'Koleksiyon Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
