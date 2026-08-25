import React from 'react';
import { Sparkles } from 'lucide-react';

interface ProductFormGeneralTabProps {
  name: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  slug: string;
  onSlugChange: (val: string) => void;
  onGenerateSlug: () => void;
  material: string;
  onMaterialChange: (val: string) => void;
  finish: string;
  onFinishChange: (val: string) => void;
  shortDescription: string;
  onShortDescriptionChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  careInstructions: string;
  onCareInstructionsChange: (val: string) => void;
  originCountry: string;
  onOriginCountryChange: (val: string) => void;
}

export const ProductFormGeneralTab: React.FC<ProductFormGeneralTabProps> = ({
  name,
  onNameChange,
  slug,
  onSlugChange,
  onGenerateSlug,
  material,
  onMaterialChange,
  finish,
  onFinishChange,
  shortDescription,
  onShortDescriptionChange,
  description,
  onDescriptionChange,
  careInstructions,
  onCareInstructionsChange,
  originCountry,
  onOriginCountryChange,
}) => {
  return (
    <div className="space-y-3.5">
      <div>
        <label htmlFor="product-name" className="block text-xs font-medium text-text-primary mb-1">
          Ürün Adı <span className="text-status-danger">*</span>
        </label>
        <input
          id="product-name"
          type="text"
          value={name}
          onChange={onNameChange}
          placeholder="Örn: Anfora Heykelsi Vazo"
          className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          required
        />
      </div>

      <div>
        <label htmlFor="product-slug" className="block text-xs font-medium text-text-primary mb-1">
          URL Slug <span className="text-status-danger">*</span>
        </label>
        <div className="flex gap-2">
          <input
            id="product-slug"
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="anfora-heykelsi-vazo"
            className="flex-1 px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
            required
          />
          <button
            type="button"
            onClick={onGenerateSlug}
            title="İsimden slug üret"
            className="px-3 py-2 text-xs rounded-md border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary flex items-center transition-colors font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-accent-primary" /> Üret
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="product-material" className="block text-xs font-medium text-text-primary mb-1">
            Malzeme <span className="text-status-danger">*</span>
          </label>
          <input
            id="product-material"
            type="text"
            value={material}
            onChange={(e) => onMaterialChange(e.target.value)}
            placeholder="Örn: Stoneware Seramik"
            className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="product-finish" className="block text-xs font-medium text-text-primary mb-1">
            Yüzey Bitişi <span className="text-status-danger">*</span>
          </label>
          <input
            id="product-finish"
            type="text"
            value={finish}
            onChange={(e) => onFinishChange(e.target.value)}
            placeholder="Örn: Mat Sırlı & Dokulu"
            className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="product-short-desc" className="block text-xs font-medium text-text-primary mb-1">
          Kısa Açıklama (Özet)
        </label>
        <input
          id="product-short-desc"
          type="text"
          value={shortDescription}
          onChange={(e) => onShortDescriptionChange(e.target.value)}
          placeholder="Örn: Nordik çizgilerle tasarlanmış mineral dokulu el yapımı seramik obje."
          className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
      </div>

      <div>
        <label htmlFor="product-description" className="block text-xs font-medium text-text-primary mb-1">
          Detaylı Açıklama
        </label>
        <textarea
          id="product-description"
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Ürün hikayesi, üretim süreci ve editoryal notlar..."
          className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="product-care" className="block text-xs font-medium text-text-primary mb-1">
            Bakım Talimatı
          </label>
          <input
            id="product-care"
            type="text"
            value={careInstructions}
            onChange={(e) => onCareInstructionsChange(e.target.value)}
            placeholder="Nemli bez ile siliniz."
            className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label htmlFor="product-origin" className="block text-xs font-medium text-text-primary mb-1">
            Menşei Ülke
          </label>
          <input
            id="product-origin"
            type="text"
            value={originCountry}
            onChange={(e) => onOriginCountryChange(e.target.value)}
            placeholder="Türkiye"
            className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>
      </div>
    </div>
  );
};
