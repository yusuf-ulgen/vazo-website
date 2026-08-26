import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import {
  AdminProductMedia,
  UploadProductMediaOptions,
  UpdateMediaMetadataInput,
} from '../types';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const STORAGE_BUCKET = 'public-media';

export function validateMediaFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Desteklenmeyen dosya formatı: "${file.type}". Yalnızca JPEG, PNG ve WebP formatları desteklenmektedir.`
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`Dosya boyutu çok büyük (${sizeMb} MB). Maksimum izin verilen boyut: 5 MB.`);
  }
}

function getFileExtension(file: File): string {
  const nameParts = file.name.split('.');
  if (nameParts.length > 1) {
    const ext = nameParts.pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

function generateStoragePath(prefix: string, ext: string, entityId?: string): string {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  if (entityId) {
    return `${prefix}/${entityId}/${uuid}.${ext}`;
  }
  return `${prefix}/${uuid}.${ext}`;
}

interface RawMediaJoinRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  media_type: 'image' | 'video';
  url: string;
  alt_text: string;
  width: number | null;
  height: number | null;
  sort_order: number;
  is_primary: boolean;
  storage_bucket?: string;
  storage_path?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | string | null;
  created_at: string;
  product_variants?: { sku: string; variant_name: string } | null;
}

export const adminMediaService = {
  async getProductMedia(productId: string): Promise<AdminProductMedia[]> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('product_media')
      .select('*, product_variants(sku, variant_name)')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[adminMediaService.getProductMedia] Error:', error);
      throw new Error(`Ürün görselleri yüklenemedi: ${error.message}`);
    }

    return ((data as unknown as RawMediaJoinRow[]) || []).map((row) => ({
      id: row.id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      media_type: row.media_type || 'image',
      url: row.url,
      alt_text: row.alt_text,
      width: row.width,
      height: row.height,
      sort_order: row.sort_order || 0,
      is_primary: Boolean(row.is_primary),
      storage_bucket: row.storage_bucket || STORAGE_BUCKET,
      storage_path: row.storage_path || null,
      mime_type: row.mime_type || null,
      file_size_bytes: row.file_size_bytes !== null && row.file_size_bytes !== undefined ? Number(row.file_size_bytes) : null,
      created_at: row.created_at,
      variant_sku: row.product_variants?.sku,
      variant_name: row.product_variants?.variant_name,
    }));
  },

  async uploadProductMedia(
    productId: string,
    file: File,
    options: UploadProductMediaOptions = {}
  ): Promise<AdminProductMedia> {
    validateMediaFile(file);

    const client = requireAdminSupabase();
    const ext = getFileExtension(file);
    const storagePath = generateStoragePath('products', ext, productId);

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[adminMediaService.uploadProductMedia] Storage upload failed:', uploadError);
      throw new Error(`Görsel Storage'a yüklenemedi: ${uploadError.message}`);
    }

    // 2. Get Public URL
    const { data: publicUrlData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Clear existing primary if needed before insert
    if (options.isPrimary) {
      await client
        .from('product_media')
        .update({ is_primary: false })
        .eq('product_id', productId);
    }

    // 4. Insert metadata into public.product_media
    const payload = {
      product_id: productId,
      variant_id: options.variantId || null,
      media_type: 'image',
      url: publicUrl,
      alt_text: options.altText?.trim() || file.name.replace(/\.[^/.]+$/, ''),
      sort_order: options.sortOrder !== undefined ? options.sortOrder : 0,
      is_primary: Boolean(options.isPrimary),
      storage_bucket: STORAGE_BUCKET,
      storage_path: storagePath,
      mime_type: file.type,
      file_size_bytes: file.size,
    };

    const { data: dbData, error: dbError } = await client
      .from('product_media')
      .insert(payload)
      .select('*, product_variants(sku, variant_name)')
      .single();

    if (dbError) {
      console.error('[adminMediaService.uploadProductMedia] DB insert failed, cleaning up Storage object:', dbError);
      // Orphan cleanup: remove the uploaded file from storage
      await client.storage.from(STORAGE_BUCKET).remove([storagePath]).catch((cleanupErr) => {
        console.warn('Orphan storage cleanup error:', cleanupErr);
      });

      throw new Error(`Görsel veritabanına kaydedilemedi: ${dbError.message}`);
    }

    const row = dbData as unknown as RawMediaJoinRow;
    return {
      id: row.id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      media_type: row.media_type,
      url: row.url,
      alt_text: row.alt_text,
      width: row.width,
      height: row.height,
      sort_order: row.sort_order,
      is_primary: row.is_primary,
      storage_bucket: row.storage_bucket || STORAGE_BUCKET,
      storage_path: row.storage_path || storagePath,
      mime_type: row.mime_type || file.type,
      file_size_bytes: row.file_size_bytes !== null && row.file_size_bytes !== undefined ? Number(row.file_size_bytes) : file.size,
      created_at: row.created_at,
      variant_sku: row.product_variants?.sku,
      variant_name: row.product_variants?.variant_name,
    };
  },

  async updateMediaMetadata(id: string, input: UpdateMediaMetadataInput): Promise<void> {
    const client = requireAdminSupabase();
    const payload: Record<string, unknown> = {};

    if (input.alt_text !== undefined) payload.alt_text = input.alt_text.trim();
    if (input.sort_order !== undefined) payload.sort_order = Number(input.sort_order);
    if (input.variant_id !== undefined) payload.variant_id = input.variant_id || null;

    if (input.is_primary === true) {
      const { data: mediaRow } = await client
        .from('product_media')
        .select('product_id')
        .eq('id', id)
        .single();

      if (mediaRow) {
        await this.setPrimaryImage(mediaRow.product_id, id);
      }
    } else if (input.is_primary === false) {
      payload.is_primary = false;
      const { error } = await client
        .from('product_media')
        .update(payload)
        .eq('id', id);

      if (error) {
        throw new Error(`Görsel bilgileri güncellenemedi: ${error.message}`);
      }
      return;
    }

    if (Object.keys(payload).length > 0) {
      const { error } = await client
        .from('product_media')
        .update(payload)
        .eq('id', id);

      if (error) {
        throw new Error(`Görsel bilgileri güncellenemedi: ${error.message}`);
      }
    }
  },

  async setPrimaryImage(productId: string, mediaId: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.rpc('set_primary_product_media', {
      p_product_id: productId,
      p_media_id: mediaId,
    });

    if (error) {
      console.error('[adminMediaService.setPrimaryImage] RPC error:', error);
      throw new Error(`Ana görsel belirlenemedi: ${error.message}`);
    }
  },

  async reorderMedia(orderedMedia: Array<{ id: string; sort_order: number }>): Promise<void> {
    const client = requireAdminSupabase();

    await Promise.all(
      orderedMedia.map(({ id, sort_order }) =>
        client
          .from('product_media')
          .update({ sort_order })
          .eq('id', id)
      )
    );
  },

  async deleteProductMedia(id: string): Promise<void> {
    const client = requireAdminSupabase();

    // 1. Fetch storage_path before delete
    const { data: mediaRow } = await client
      .from('product_media')
      .select('storage_path, storage_bucket')
      .eq('id', id)
      .single();

    // 2. Delete DB row
    const { error: dbError } = await client
      .from('product_media')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new Error(`Görsel kaydı silinemedi: ${dbError.message}`);
    }

    // 3. Delete from storage if storage_path is present
    if (mediaRow?.storage_path) {
      const bucket = mediaRow.storage_bucket || STORAGE_BUCKET;
      await client.storage.from(bucket).remove([mediaRow.storage_path]).catch((err) => {
        console.warn('Storage file cleanup failed on delete:', err);
      });
    }
  },

  async uploadGenericAsset(
    prefix: 'categories' | 'collections' | 'cms',
    file: File,
    entityId?: string
  ): Promise<{ url: string; storagePath: string; mimeType: string; fileSizeBytes: number }> {
    validateMediaFile(file);

    const client = requireAdminSupabase();
    const ext = getFileExtension(file);
    const storagePath = generateStoragePath(prefix, ext, entityId);

    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`Medya yüklenemedi: ${error.message}`);
    }

    const { data: publicUrlData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return {
      url: publicUrlData.publicUrl,
      storagePath,
      mimeType: file.type,
      fileSizeBytes: file.size,
    };
  },
};
