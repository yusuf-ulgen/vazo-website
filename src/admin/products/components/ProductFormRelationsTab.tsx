import React from 'react';
import type { AdminCategory } from '@/admin/categories/types';
import type { AdminCollection } from '@/admin/collections/types';

interface ProductFormRelationsTabProps {
  categories: AdminCategory[];
  collections: AdminCollection[];
  primaryCategoryId: string;
  onPrimaryCategoryIdChange: (val: string) => void;
  selectedCategoryIds: string[];
  onToggleCategorySelection: (catId: string) => void;
  selectedCollectionIds: string[];
  onToggleCollectionSelection: (colId: string) => void;
}

export const ProductFormRelationsTab: React.FC<ProductFormRelationsTabProps> = ({
  categories,
  collections,
  primaryCategoryId,
  onPrimaryCategoryIdChange,
  selectedCategoryIds,
  onToggleCategorySelection,
  selectedCollectionIds,
  onToggleCollectionSelection,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="product-primary-category" className="block text-xs font-medium text-text-primary mb-1">
          Birincil Kategori (Primary Category)
        </label>
        <select
          id="product-primary-category"
          value={primaryCategoryId}
          onChange={(e) => onPrimaryCategoryIdChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        >
          <option value="">Seçiniz (Kategorisiz)</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} {!cat.active ? '(Pasif)' : ''}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-text-muted mt-1">
          Katalog ekmek kırıntısı (breadcrumbs) ve birincil filtrelemelerde kullanılır.
        </p>
      </div>

      <div>
        <span className="block text-xs font-medium text-text-primary mb-1.5">
          Ek Kategoriler (Çoklu Seçim)
        </span>
        <div className="max-h-36 overflow-y-auto border border-border-default rounded-md p-2 space-y-1.5 bg-canvas-default">
          {categories.length === 0 ? (
            <span className="text-xs text-text-muted">Kategori bulunamadı.</span>
          ) : (
            categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(cat.id) || primaryCategoryId === cat.id}
                  disabled={primaryCategoryId === cat.id}
                  onChange={() => onToggleCategorySelection(cat.id)}
                  className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
                />
                <span>{cat.name}</span>
                {!cat.active && <span className="text-[10px] text-text-muted">(Pasif)</span>}
              </label>
            ))
          )}
        </div>
      </div>

      <div>
        <span className="block text-xs font-medium text-text-primary mb-1.5">
          Bağlı Koleksiyonlar (Çoklu Seçim)
        </span>
        <div className="max-h-36 overflow-y-auto border border-border-default rounded-md p-2 space-y-1.5 bg-canvas-default">
          {collections.length === 0 ? (
            <span className="text-xs text-text-muted">Koleksiyon bulunamadı.</span>
          ) : (
            collections.map((col) => (
              <label key={col.id} className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCollectionIds.includes(col.id)}
                  onChange={() => onToggleCollectionSelection(col.id)}
                  className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
                />
                <span>{col.name}</span>
                {!col.active && <span className="text-[10px] text-text-muted">(Pasif)</span>}
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
