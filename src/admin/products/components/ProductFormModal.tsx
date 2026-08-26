import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/admin/ui';
import { adminProductRepository } from '../api/admin-product-repository';
import { generateSlug } from '@/admin/categories/api/admin-category-repository';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import { ProductFormGeneralTab } from './ProductFormGeneralTab';
import { ProductFormPricingTab } from './ProductFormPricingTab';
import { ProductFormRelationsTab } from './ProductFormRelationsTab';
import { ProductFormSeoTab } from './ProductFormSeoTab';
import { ProductFormVariantsTab } from './ProductFormVariantsTab';
import { ProductFormGalleryTab } from './ProductFormGalleryTab';
import type { AdminProduct } from '../types';
import type { AdminCategory } from '@/admin/categories/types';
import type { AdminCollection } from '@/admin/collections/types';
import type { ProductStatus } from '@/entities/product/types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: AdminProduct | null;
  categories: AdminCategory[];
  collections: AdminCollection[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  categories,
  collections,
}) => {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(initialData);

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string>('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [material, setMaterial] = useState('Stoneware Seramik');
  const [finish, setFinish] = useState('Mat Sırlı');
  const [careInstructions, setCareInstructions] = useState('');
  const [originCountry, setOriginCountry] = useState('Türkiye');
  const [retailPrice, setRetailPrice] = useState<string>('0');
  const [compareAtPrice, setCompareAtPrice] = useState<string>('');
  const [retailEnabled, setRetailEnabled] = useState(true);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(true);
  const [wholesaleMoq, setWholesaleMoq] = useState<string>('1');
  const [wholesaleLeadTimeDays, setWholesaleLeadTimeDays] = useState<string>('14');
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'relations' | 'variants' | 'gallery' | 'seo'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSlug(initialData.slug);
      setShortDescription(initialData.short_description || '');
      setDescription(initialData.description || '');
      setStatus(initialData.status);
      setPrimaryCategoryId(initialData.primary_category_id || '');
      setSelectedCategoryIds(initialData.category_ids || []);
      setSelectedCollectionIds(initialData.collection_ids || []);
      setMaterial(initialData.material || 'Stoneware Seramik');
      setFinish(initialData.finish || 'Mat Sırlı');
      setCareInstructions(initialData.care_instructions || '');
      setOriginCountry(initialData.origin_country || 'Türkiye');
      setRetailPrice(String(initialData.retail_price));
      setCompareAtPrice(initialData.compare_at_price !== null ? String(initialData.compare_at_price) : '');
      setRetailEnabled(initialData.retail_enabled);
      setWholesaleEnabled(initialData.wholesale_enabled);
      setWholesaleMoq(String(initialData.wholesale_moq || 1));
      setWholesaleLeadTimeDays(initialData.wholesale_lead_time_days !== null ? String(initialData.wholesale_lead_time_days) : '14');
      setFeatured(initialData.featured);
      setNewArrival(initialData.new_arrival);
      setBestseller(initialData.bestseller);
      setTagsInput(initialData.tags?.join(', ') || '');
      setSeoTitle(initialData.seo_title || '');
      setSeoDescription(initialData.seo_description || '');
    } else {
      setName('');
      setSlug('');
      setShortDescription('');
      setDescription('');
      setStatus('draft');
      setPrimaryCategoryId('');
      setSelectedCategoryIds([]);
      setSelectedCollectionIds([]);
      setMaterial('Stoneware Seramik');
      setFinish('Mat Sırlı');
      setCareInstructions('');
      setOriginCountry('Türkiye');
      setRetailPrice('0');
      setCompareAtPrice('');
      setRetailEnabled(true);
      setWholesaleEnabled(true);
      setWholesaleMoq('1');
      setWholesaleLeadTimeDays('14');
      setFeatured(false);
      setNewArrival(false);
      setBestseller(false);
      setTagsInput('');
      setSeoTitle('');
      setSeoDescription('');
    }
    setErrorMessage(null);
    setActiveTab('general');
  }, [initialData, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing && (!slug || slug === generateSlug(name))) {
      setSlug(generateSlug(val));
    }
  };

  const handleGenerateSlug = () => {
    if (name.trim()) {
      setSlug(generateSlug(name));
    }
  };

  const toggleCategorySelection = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleCollectionSelection = (colId: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Ürün adı zorunludur.');
      setActiveTab('general');
      return;
    }

    const trimmedSlug = (slug || generateSlug(trimmedName)).trim().toLowerCase();
    if (!trimmedSlug) {
      setErrorMessage('Geçerli bir URL slug adresi zorunludur.');
      setActiveTab('general');
      return;
    }

    const numRetailPrice = Number(retailPrice);
    if (isNaN(numRetailPrice) || numRetailPrice < 0) {
      setErrorMessage('Perakende fiyatı geçerli bir pozitif sayı olmalıdır.');
      setActiveTab('pricing');
      return;
    }

    const numCompareAtPrice = compareAtPrice ? Number(compareAtPrice) : null;
    if (numCompareAtPrice !== null && numCompareAtPrice < numRetailPrice) {
      setErrorMessage('Eski fiyat (karşılaştırma fiyatı) mevcut perakende fiyatından düşük olamaz.');
      setActiveTab('pricing');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    try {
      if (isEditing && initialData) {
        await adminProductRepository.updateProduct(initialData.id, {
          name: trimmedName,
          slug: trimmedSlug,
          short_description: shortDescription.trim() || trimmedName,
          description: description.trim() || trimmedName,
          status,
          primary_category_id: primaryCategoryId || null,
          category_ids: selectedCategoryIds,
          collection_ids: selectedCollectionIds,
          material: material.trim(),
          finish: finish.trim(),
          care_instructions: careInstructions.trim() || null,
          origin_country: originCountry.trim() || 'Türkiye',
          retail_price: numRetailPrice,
          compare_at_price: numCompareAtPrice,
          retail_enabled: retailEnabled,
          wholesale_enabled: wholesaleEnabled,
          wholesale_moq: Math.max(1, Number(wholesaleMoq) || 1),
          wholesale_lead_time_days: wholesaleLeadTimeDays ? Number(wholesaleLeadTimeDays) : null,
          featured,
          new_arrival: newArrival,
          bestseller,
          tags,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
        });

        success('Ürün Güncellendi', `"${trimmedName}" başarıyla kaydedildi.`);
      } else {
        await adminProductRepository.createProduct({
          name: trimmedName,
          slug: trimmedSlug,
          short_description: shortDescription.trim() || trimmedName,
          description: description.trim() || trimmedName,
          status,
          primary_category_id: primaryCategoryId || null,
          category_ids: selectedCategoryIds,
          collection_ids: selectedCollectionIds,
          material: material.trim(),
          finish: finish.trim(),
          care_instructions: careInstructions.trim() || null,
          origin_country: originCountry.trim() || 'Türkiye',
          retail_price: numRetailPrice,
          compare_at_price: numCompareAtPrice,
          retail_enabled: retailEnabled,
          wholesale_enabled: wholesaleEnabled,
          wholesale_moq: Math.max(1, Number(wholesaleMoq) || 1),
          wholesale_lead_time_days: wholesaleLeadTimeDays ? Number(wholesaleLeadTimeDays) : null,
          featured,
          new_arrival: newArrival,
          bestseller,
          tags,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
        });

        success('Ürün Oluşturuldu', `"${trimmedName}" kataloğa eklendi.`);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ürün kaydedilirken bir hata oluştu.';
      setErrorMessage(msg);
      toastError('İşlem Başarısız', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-surface-primary border border-border-default shadow-elevated w-full max-w-2xl max-h-[90vh] flex flex-col my-8 rounded-lg overflow-hidden focus:outline-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
          <div>
            <h2 id="product-modal-title" className="font-serif text-lg font-medium text-text-primary">
              {isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {isEditing
                ? 'Ürün detaylarını, fiyatlarını, taksonomisini ve durumunu güncelleyin.'
                : 'Kataloğa yeni bir seramik vazo veya heykelsi obje ekleyin.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-feedback-error/10 border border-feedback-error/20 rounded text-feedback-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'general'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Temel Bilgiler
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'pricing'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Fiyat & Kanallar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('relations')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'relations'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Kategoriler & Koleksiyonlar
            </button>
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('variants')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === 'variants'
                      ? 'bg-surface-secondary text-text-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Varyantlar (SKU)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gallery')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === 'gallery'
                      ? 'bg-surface-secondary text-text-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Medya Galerisi
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'seo'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Durum & SEO
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === 'general' && (
            <ProductFormGeneralTab
              name={name}
              onNameChange={handleNameChange}
              slug={slug}
              onSlugChange={setSlug}
              onGenerateSlug={handleGenerateSlug}
              material={material}
              onMaterialChange={setMaterial}
              finish={finish}
              onFinishChange={setFinish}
              shortDescription={shortDescription}
              onShortDescriptionChange={setShortDescription}
              description={description}
              onDescriptionChange={setDescription}
              careInstructions={careInstructions}
              onCareInstructionsChange={setCareInstructions}
              originCountry={originCountry}
              onOriginCountryChange={setOriginCountry}
            />
          )}

          {activeTab === 'pricing' && (
            <ProductFormPricingTab
              retailPrice={retailPrice}
              onRetailPriceChange={setRetailPrice}
              compareAtPrice={compareAtPrice}
              onCompareAtPriceChange={setCompareAtPrice}
              retailEnabled={retailEnabled}
              onRetailEnabledChange={setRetailEnabled}
              wholesaleEnabled={wholesaleEnabled}
              onWholesaleEnabledChange={setWholesaleEnabled}
              wholesaleMoq={wholesaleMoq}
              onWholesaleMoqChange={setWholesaleMoq}
              wholesaleLeadTimeDays={wholesaleLeadTimeDays}
              onWholesaleLeadTimeDaysChange={setWholesaleLeadTimeDays}
              featured={featured}
              onFeaturedChange={setFeatured}
              newArrival={newArrival}
              onNewArrivalChange={setNewArrival}
              bestseller={bestseller}
              onBestsellerChange={setBestseller}
            />
          )}

          {activeTab === 'relations' && (
            <ProductFormRelationsTab
              categories={categories}
              collections={collections}
              primaryCategoryId={primaryCategoryId}
              onPrimaryCategoryIdChange={setPrimaryCategoryId}
              selectedCategoryIds={selectedCategoryIds}
              onToggleCategorySelection={toggleCategorySelection}
              selectedCollectionIds={selectedCollectionIds}
              onToggleCollectionSelection={toggleCollectionSelection}
            />
          )}

          {activeTab === 'variants' && isEditing && (
            <ProductFormVariantsTab productId={initialData?.id} />
          )}

          {activeTab === 'gallery' && isEditing && (
            <ProductFormGalleryTab productId={initialData?.id} />
          )}

          {activeTab === 'seo' && (
            <ProductFormSeoTab
              status={status}
              onStatusChange={setStatus}
              tagsInput={tagsInput}
              onTagsInputChange={setTagsInput}
              seoTitle={seoTitle}
              onSeoTitleChange={setSeoTitle}
              seoDescription={seoDescription}
              onSeoDescriptionChange={setSeoDescription}
            />
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
            <div className="text-[11px] text-text-muted">
              {isEditing ? `ID: ${initialData?.id}` : 'Yeni ürün taslak olarak oluşturulacaktır.'}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium rounded border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium rounded bg-accent-primary text-text-inverse hover:bg-accent-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEditing ? 'Değişiklikleri Kaydet' : 'Ürünü Oluştur'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
