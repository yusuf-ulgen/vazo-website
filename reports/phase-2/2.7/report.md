# Phase 2.7 Report

## Objective
Implement secure Supabase Storage integration and product media management across the Admin panel, supporting file validation (JPEG, PNG, WebP up to 5 MB), collision-resistant object paths, truthful upload lifecycle progression, single primary image enforcement, orphan object cleanup upon database failure, and media deletion synchronization across both Postgres and Supabase Storage.

## Starting Commit
5540a08007bf2f3277ec4c5ab47a1b1d2118e388

## Implementation Commit
953df6b1ff9a3cae8550f3b213d28001f2abd068

## Storage Architecture & Bucket Setup
- **Single Reusable Bucket**: `public-media`
  - Public read enabled for CDN and storefront rendering.
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
  - Maximum file size: 10 MB (bucket configuration) / 5 MB (client-side validation rule).
- **Collision-Resistant Key Prefixes**:
  - Products: `products/{productId}/{uuid}.{ext}`
  - Categories: `categories/{categoryId}/{uuid}.{ext}`
  - Collections: `collections/{collectionId}/{uuid}.{ext}`
  - CMS: `cms/{uuid}.{ext}`
  - Original client filenames are never trusted as unique object paths.

## Storage Row Level Security (RLS) Policies
Defined in `supabase/migrations/20260826020000_phase2_storage_setup.sql`:
- **Public Read (`SELECT`)**: Unrestricted read access for objects within `bucket_id = 'public-media'`.
- **Admin Upload (`INSERT`)**: Restricted to authenticated users satisfying `public.is_admin()`.
- **Admin Update (`UPDATE`)**: Restricted to authenticated users satisfying `public.is_admin()`.
- **Admin Delete (`DELETE`)**: Restricted to authenticated users satisfying `public.is_admin()`.
- **Anonymous / Storefront Customers**: Direct writes, updates, and deletes are strictly denied by Postgres Storage RLS.
- **Zero Service-Role Usage**: Browser clients interact exclusively using the public anon client under RLS protection.

## MIME & File Size Security
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
- **SVG Prohibition**: SVG uploads are explicitly rejected to prevent Cross-Site Scripting (XSS) and XML Entity injection vectors in user-uploaded media.
- Maximum file size: 5 MB per file enforced prior to initiating upload.

## Database Schema Additions
Additive migration `supabase/migrations/20260826020000_phase2_storage_setup.sql`:
- `public.product_media`:
  - `storage_bucket TEXT NOT NULL DEFAULT 'public-media'`
  - `storage_path TEXT`
  - `mime_type TEXT`
  - `file_size_bytes BIGINT`
- Indexes created:
  - `idx_product_media_storage_path` ON `public.product_media(storage_path)`
  - `idx_product_media_primary` ON `public.product_media(product_id, is_primary) WHERE is_primary = true`
  - `idx_product_media_sort` ON `public.product_media(product_id, sort_order)`

## Upload Lifecycle & Failure Recovery
1. **Truthful Upload States**: Queue displays `queued` -> `uploading` (Storage) -> `finalizing` (Database metadata) -> `done` (or `error`).
2. **Primary Image Enforcement**: When an image is marked primary, all other media for that product are atomically updated to `is_primary = false`.
3. **Orphan Storage Cleanup**: If the database metadata `INSERT` fails after a file has been placed into Storage, `adminMediaService` catches the exception and immediately invokes `supabase.storage.from(bucket).remove([storagePath])` to prevent orphaned binary storage buildup.
4. **Deletion Synchronization**: Deleting a media item in the admin UI executes database deletion and purges the binary object from Supabase Storage.

## Reusable Asset Management
- Created `AssetUploadButton` component (`src/admin/media/components/AssetUploadButton.tsx`) for immediate reuse in Category and Collection management modals.

## Files Changed
- `supabase/migrations/20260826020000_phase2_storage_setup.sql`: Storage bucket creation, Storage RLS policies, and additive `product_media` columns.
- `src/admin/media/types.ts`: TypeScript interfaces for media items and upload queue.
- `src/admin/media/api/admin-media-service.ts`: Dedicated media service for validation, upload, primary image, reordering, deletion, and orphan cleanup.
- `src/admin/media/components/AssetUploadButton.tsx`: Reusable storage upload button for taxonomy and CMS.
- `src/admin/products/components/ProductFormGalleryTab.tsx`: Product gallery management tab with drag & drop, upload queue, primary image toggle, variant binding, and reordering.
- `src/admin/products/components/ProductFormModal.tsx`: Embedded gallery tab when editing existing products.
- `src/admin/categories/components/CategoryFormModal.tsx`: Integrated `AssetUploadButton`.
- `src/admin/collections/components/CollectionFormModal.tsx`: Integrated `AssetUploadButton`.
- `tests/mocks/supabase-mock.ts`: Added mock storage client.
- `tests/unit/admin/admin-media-service.test.ts`: Unit test suite (11 tests).
- `tests/component/admin/product-form-gallery-tab.test.tsx`: Component test suite (3 tests).

## Quality Gates & Test Results
- `npm run check:repo`: **PASS** — No secrets or prohibited files detected.
- `npm run check:lines`: **PASS** — All 248 source files comply with the 600-line hard limit.
- `npm run lint`: **PASS** — 0 ESLint errors or warnings.
- `npm run typecheck`: **PASS** — 0 TypeScript diagnostics.
- `npm run test`: **PASS** — 61 test suites passed, 385/385 tests passed.
- `npm run test:db`: **PASS** — Database security test suite (38 pgTAP assertions) validated successfully.
- `npm run build`: **PASS** — Production bundle compiled cleanly.

## Security Invariants
- Direct anonymous or customer writes to `storage.objects` are blocked by Postgres RLS.
- Only users with verified `public.is_admin()` sessions can upload, update, or delete media.
- Storefront `ProductGallery` continues to render public media URLs without regressions.

---

Main branch modified: NO
Main branch pushed: NO
Merge performed: NO
Working branch: phase-2
