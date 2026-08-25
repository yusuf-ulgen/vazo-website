import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { adminMediaService } from '../api/admin-media-service';
import { useToast } from '@/admin/ui';

interface AssetUploadButtonProps {
  prefix: 'categories' | 'collections' | 'cms';
  entityId?: string;
  onUploaded: (url: string) => void;
  label?: string;
  disabled?: boolean;
}

export const AssetUploadButton: React.FC<AssetUploadButtonProps> = ({
  prefix,
  entityId,
  onUploaded,
  label = 'Storage\'a Yükle',
  disabled = false,
}) => {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await adminMediaService.uploadGenericAsset(prefix, file, entityId);
      onUploaded(result.url);
      success('Görsel Yüklendi', `"${file.name}" başarıyla Supabase Storage'a yüklendi.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Yükleme başarısız.';
      toastError('Yükleme Hatası', msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary transition-colors disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-primary" />
            <span>Yükleniyor...</span>
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5 text-accent-primary" />
            <span>{label}</span>
          </>
        )}
      </button>
    </>
  );
};
