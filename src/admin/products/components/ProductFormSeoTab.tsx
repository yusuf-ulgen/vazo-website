import React from 'react';
import type { ProductStatus } from '@/entities/product/types';

interface ProductFormSeoTabProps {
  status: ProductStatus;
  onStatusChange: (val: ProductStatus) => void;
  tagsInput: string;
  onTagsInputChange: (val: string) => void;
  seoTitle: string;
  onSeoTitleChange: (val: string) => void;
  seoDescription: string;
  onSeoDescriptionChange: (val: string) => void;
}

export const ProductFormSeoTab: React.FC<ProductFormSeoTabProps> = ({
  status,
  onStatusChange,
  tagsInput,
  onTagsInputChange,
  seoTitle,
  onSeoTitleChange,
  seoDescription,
  onSeoDescriptionChange,
}) => {
  return (
    <div className="space-y-3.5">
      <div>
        <label htmlFor="product-status" className="block text-xs font-medium text-text-primary mb-1">
          Yayın Durumu (Status)
        </label>
        <select
          id="product-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as ProductStatus)}
          className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary font-medium"
        >
          <option value="draft">Taslak (Draft) — Sadece Admin görebilir</option>
          <option value="published">Yayında (Published) — Müşterilere açık</option>
          <option value="archived">Arşivlendi (Archived) — Katalogdan kaldırıldı</option>
          <option value="out_of_stock">Stokta Yok (Out of stock)</option>
        </select>
      </div>

      <div>
        <label htmlFor="product-tags" className="block text-xs font-medium text-text-primary mb-1">
          Etiketler (Virgülle ayırınız)
        </label>
        <input
          id="product-tags"
          type="text"
          value={tagsInput}
          onChange={(e) => onTagsInputChange(e.target.value)}
          placeholder="vazo, seramik, masa-ustu, heykelsi, 2026"
          className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
      </div>

      <div>
        <label htmlFor="product-seo-title" className="block text-xs font-medium text-text-primary mb-1">
          SEO Başlığı (Title)
        </label>
        <input
          id="product-seo-title"
          type="text"
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value)}
          placeholder="Örn: Anfora Heykelsi Seramik Vazo | Vazo Studio"
          className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
      </div>

      <div>
        <label htmlFor="product-seo-desc" className="block text-xs font-medium text-text-primary mb-1">
          SEO Açıklaması (Meta Description)
        </label>
        <textarea
          id="product-seo-desc"
          rows={2}
          value={seoDescription}
          onChange={(e) => onSeoDescriptionChange(e.target.value)}
          placeholder="Arama motorları için ürün özeti..."
          className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none"
        />
      </div>
    </div>
  );
};
