import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { ProductImage as ProductImageType } from '@/entities/product/types';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';

export interface ProductGalleryProps {
  media: ProductImageType[];
  productName: string;
}

export function ProductGallery({ media, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  const { containerRef: zoomContainerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen: isZoomModalOpen,
    onClose: () => setIsZoomModalOpen(false),
  });

  const images = media.length > 0
    ? media
    : [{ id: '1', url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85', alt: productName, isPrimary: true }];

  const currentImage = images[selectedIndex] || images[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <div className="flex flex-col-reverse lg:flex-row gap-4 sm:gap-6">
        {/* Thumbnails (Vertical on desktop) */}
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-[580px] shrink-0 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              aria-label={`${productName} görsel ${idx + 1}`}
              className={`relative w-16 h-20 sm:w-20 sm:h-24 shrink-0 overflow-hidden bg-surface-secondary border transition-all ${
                selectedIndex === idx
                  ? 'border-text-primary ring-1 ring-text-primary'
                  : 'border-border-default hover:border-border-strong opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={img.url}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Main Image Stage */}
        <div className="relative flex-1 aspect-[3/4] sm:aspect-[4/5] lg:aspect-[4/5] bg-surface-secondary overflow-hidden group">
          <img
            src={currentImage?.url}
            alt={currentImage?.alt || productName}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Önceki Görsel"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-primary/80 hover:bg-surface-primary text-text-primary flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Sonraki Görsel"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-primary/80 hover:bg-surface-primary text-text-primary flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Zoom Trigger Button */}
          <button
            type="button"
            onClick={() => setIsZoomModalOpen(true)}
            aria-label="Görseli Büyüt"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-surface-primary/80 hover:bg-surface-primary text-text-primary flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomModalOpen && (
        <div
          ref={zoomContainerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Büyütülmüş Ürün Görseli"
          onClick={() => setIsZoomModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setIsZoomModalOpen(false)}
            aria-label="Kapat"
            className="absolute top-4 right-4 text-white hover:opacity-80 p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentImage?.url}
            alt={currentImage?.alt || productName}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </>
  );
}
