export type MediaType = 'image' | 'video';

export type UploadState = 'queued' | 'uploading' | 'finalizing' | 'done' | 'error';

export interface AdminProductMedia {
  id: string;
  product_id: string;
  variant_id: string | null;
  media_type: MediaType;
  url: string;
  alt_text: string;
  width: number | null;
  height: number | null;
  sort_order: number;
  is_primary: boolean;
  storage_bucket: string;
  storage_path: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
  variant_name?: string;
  variant_sku?: string;
}

export interface UploadProductMediaOptions {
  altText?: string;
  isPrimary?: boolean;
  variantId?: string | null;
  sortOrder?: number;
}

export interface UpdateMediaMetadataInput {
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
  variant_id?: string | null;
}

export interface MediaUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  state: UploadState;
  errorMessage?: string;
  altText: string;
  isPrimary: boolean;
  variantId?: string | null;
}
