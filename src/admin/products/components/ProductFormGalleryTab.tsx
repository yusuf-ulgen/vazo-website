import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  Star,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { adminMediaService, validateMediaFile } from '@/admin/media/api/admin-media-service';
import { ConfirmDialog, useToast } from '@/admin/ui';
import type { AdminProductMedia, MediaUploadItem } from '@/admin/media/types';
import type { AdminProductVariant } from '@/admin/variants/types';

interface ProductFormGalleryTabProps {
  productId?: string;
  variants?: AdminProductVariant[];
}

export const ProductFormGalleryTab: React.FC<ProductFormGalleryTabProps> = ({
  productId,
  variants = [],
}) => {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaList, setMediaList] = useState<AdminProductMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [uploadQueue, setUploadQueue] = useState<MediaUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [deletingMedia, setDeletingMedia] = useState<AdminProductMedia | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMedia = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await adminMediaService.getProductMedia(productId);
      setMediaList(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Görseller yüklenemedi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleFilesSelected = (files: FileList | File[]) => {
    if (!productId) return;
    const newItems: MediaUploadItem[] = [];

    Array.from(files).forEach((file) => {
      try {
        validateMediaFile(file);
        newItems.push({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
          file,
          previewUrl: URL.createObjectURL(file),
          state: 'queued',
          altText: file.name.replace(/\.[^/.]+$/, ''),
          isPrimary: mediaList.length === 0 && newItems.length === 0,
          variantId: null,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Geçersiz dosya.';
        toastError('Dosya Reddedildi', `${file.name}: ${msg}`);
      }
    });

    if (newItems.length > 0) {
      setUploadQueue((prev) => [...prev, ...newItems]);
    }
  };

  // Process upload queue
  useEffect(() => {
    if (!productId || isUploading || uploadQueue.length === 0) return;

    const nextItem = uploadQueue.find((item) => item.state === 'queued');
    if (!nextItem) return;

    const processUpload = async () => {
      setIsUploading(true);

      // 1. State: uploading
      setUploadQueue((prev) =>
        prev.map((i) => (i.id === nextItem.id ? { ...i, state: 'uploading' } : i))
      );

      try {
        // 2. State: finalizing
        setUploadQueue((prev) =>
          prev.map((i) => (i.id === nextItem.id ? { ...i, state: 'finalizing' } : i))
        );

        await adminMediaService.uploadProductMedia(productId, nextItem.file, {
          altText: nextItem.altText,
          isPrimary: nextItem.isPrimary,
          variantId: nextItem.variantId,
          sortOrder: mediaList.length + 1,
        });

        // 3. State: done
        setUploadQueue((prev) =>
          prev.map((i) => (i.id === nextItem.id ? { ...i, state: 'done' } : i))
        );

        success('Görsel Yüklendi', `"${nextItem.file.name}" galeriye eklendi.`);
        loadMedia();

        // Clean up preview URL
        URL.revokeObjectURL(nextItem.previewUrl);

        // Remove from queue after brief delay
        setTimeout(() => {
          setUploadQueue((prev) => prev.filter((i) => i.id !== nextItem.id));
        }, 1500);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Yükleme başarısız.';
        setUploadQueue((prev) =>
          prev.map((i) => (i.id === nextItem.id ? { ...i, state: 'error', errorMessage: msg } : i))
        );
        toastError('Yükleme Hatası', msg);
      } finally {
        setIsUploading(false);
      }
    };

    processUpload();
  }, [uploadQueue, isUploading, productId, mediaList.length, success, toastError, loadMedia]);

  const handleSetPrimary = async (media: AdminProductMedia) => {
    if (!productId || media.is_primary) return;

    try {
      await adminMediaService.setPrimaryImage(productId, media.id);
      success('Ana Görsel Güncellendi', 'Ürün vitrin görseli başarıyla belirlendi.');
      loadMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ana görsel ayarlanamadı.';
      toastError('Hata', msg);
    }
  };

  const handleVariantChange = async (media: AdminProductMedia, variantId: string) => {
    try {
      await adminMediaService.updateMediaMetadata(media.id, {
        variant_id: variantId === 'all' ? null : variantId,
      });
      loadMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Varyant eşlemesi kaydedilemedi.';
      toastError('Hata', msg);
    }
  };

  const handleAltTextBlur = async (media: AdminProductMedia, newAlt: string) => {
    if (newAlt.trim() === media.alt_text) return;

    try {
      await adminMediaService.updateMediaMetadata(media.id, {
        alt_text: newAlt.trim(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Alt metin güncellenemedi.';
      toastError('Hata', msg);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const reordered = [...mediaList];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    const payload = reordered.map((m, idx) => ({ id: m.id, sort_order: idx + 1 }));
    setMediaList(reordered);

    try {
      await adminMediaService.reorderMedia(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sıralama kaydedilemedi.';
      toastError('Hata', msg);
      loadMedia();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMedia) return;

    setIsDeleting(true);
    try {
      await adminMediaService.deleteProductMedia(deletingMedia.id);
      success('Görsel Silindi', 'Görsel ve Storage dosyası başarıyla kaldırıldı.');
      setDeletingMedia(null);
      loadMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Görsel silinemedi.';
      toastError('Hata', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!productId) {
    return (
      <div className="p-6 text-center text-xs text-text-muted bg-surface-secondary/40 rounded-lg border border-border-subtle">
        Ürün görsellerini yüklemek için önce temel ürün bilgilerini kaydediniz.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-text-primary block">
            Ürün Medya Galerisi ({mediaList.length} Görsel)
          </span>
          <span className="text-[11px] text-text-muted">
            Supabase Storage tabanlı yüksek çözünürlüklü ürün fotoğrafları (JPEG, PNG, WebP — Maks 5 MB).
          </span>
        </div>
        <button
          type="button"
          onClick={loadMedia}
          disabled={isLoading}
          className="p-1.5 rounded border border-border-default text-text-secondary hover:text-text-primary transition-colors"
          title="Yenile"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 bg-feedback-error/10 border border-feedback-error/20 rounded text-feedback-error text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) {
            handleFilesSelected(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-border-default hover:border-accent-primary/50 bg-surface-secondary/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files) {
              handleFilesSelected(e.target.files);
            }
          }}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary">
              Görselleri buraya sürükleyin veya <span className="text-accent-primary underline">dosya seçin</span>
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Desteklenen formatlar: JPG, PNG, WebP (Maksimum 5 MB / dosya)
            </p>
          </div>
        </div>
      </div>

      {/* Upload Queue Progression */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-text-secondary block">Yükleme Kuyruğu</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 bg-surface-secondary/50 rounded-lg border border-border-subtle text-xs"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-10 h-10 rounded object-cover border border-border-subtle shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-text-primary block truncate">{item.file.name}</span>
                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
                    {item.state === 'queued' && <span>Kuyrukta bekliyor...</span>}
                    {item.state === 'uploading' && (
                      <span className="text-accent-primary flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Storage'a yükleniyor...
                      </span>
                    )}
                    {item.state === 'finalizing' && (
                      <span className="text-accent-primary flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Veritabanına işleniyor...
                      </span>
                    )}
                    {item.state === 'done' && (
                      <span className="text-feedback-success flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Yüklendi
                      </span>
                    )}
                    {item.state === 'error' && (
                      <span className="text-feedback-error truncate">{item.errorMessage || 'Hata oluştu'}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Grid */}
      {mediaList.length === 0 && !isLoading ? (
        <div className="p-8 text-center border border-dashed border-border-default rounded-lg text-xs text-text-muted">
          Bu ürüne ait henüz görsel bulunmuyor. Yukarıdaki alandan görsel yükleyebilirsiniz.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mediaList.map((media, idx) => (
            <div
              key={media.id}
              className={`bg-surface-primary border rounded-lg overflow-hidden flex flex-col transition-all shadow-subtle ${
                media.is_primary ? 'border-accent-primary ring-1 ring-accent-primary' : 'border-border-default'
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-4/3 bg-surface-secondary/40 overflow-hidden group">
                <img
                  src={media.url}
                  alt={media.alt_text || 'Ürün görseli'}
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge */}
                {media.is_primary && (
                  <div className="absolute top-2 left-2 bg-accent-primary text-text-inverse text-[10px] font-bold px-2 py-0.5 rounded shadow-subtle flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Ana Görsel
                  </div>
                )}

                {/* Quick Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!media.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(media)}
                      className="px-2.5 py-1.5 rounded bg-surface-primary text-text-primary hover:bg-accent-primary hover:text-text-inverse text-xs font-medium transition-colors shadow-subtle flex items-center gap-1"
                      title="Ana Görsel Yap"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Ana Yap</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeletingMedia(media)}
                    className="p-1.5 rounded bg-feedback-error text-text-inverse hover:bg-feedback-error/90 transition-colors shadow-subtle"
                    title="Görseli Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Meta & Controls */}
              <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between text-xs">
                <div>
                  <label htmlFor={`alt-${media.id}`} className="block text-[11px] font-medium text-text-secondary mb-1">
                    Alt Metni (SEO & Erişilebilirlik)
                  </label>
                  <input
                    id={`alt-${media.id}`}
                    type="text"
                    defaultValue={media.alt_text}
                    onBlur={(e) => handleAltTextBlur(media, e.target.value)}
                    placeholder="Görsel açıklaması..."
                    className="w-full px-2 py-1 text-xs rounded bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                </div>

                {variants.length > 0 && (
                  <div>
                    <label htmlFor={`variant-${media.id}`} className="block text-[11px] font-medium text-text-secondary mb-1">
                      Bağlı Varyant (SKU)
                    </label>
                    <select
                      id={`variant-${media.id}`}
                      value={media.variant_id || 'all'}
                      onChange={(e) => handleVariantChange(media, e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    >
                      <option value="all">Tüm Varyantlar / Genel</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.sku} — {v.variant_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] text-text-muted">
                  <span>Sıra: #{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-surface-secondary text-text-secondary disabled:opacity-30"
                      title="Sola / Öne Taşı"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(idx, 'right')}
                      disabled={idx === mediaList.length - 1}
                      className="p-1 rounded hover:bg-surface-secondary text-text-secondary disabled:opacity-30"
                      title="Sağa / Arkaya Taşı"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingMedia)}
        onCancel={() => setDeletingMedia(null)}
        onConfirm={handleDeleteConfirm}
        title="Görseli Sil"
        message="Bu görseli silmek istediğinizden emin misiniz? Dosya Supabase Storage üzerinden de kalıcı olarak kaldırılacaktır."
        confirmLabel="Görseli Sil"
        cancelLabel="Vazgeç"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
