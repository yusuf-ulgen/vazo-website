import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  AdminPageHeader,
  DataTable,
  SearchField,
  FilterDropdown,
  StatusBadge,
  ConfirmDialog,
  Pagination,
  useToast,
} from '@/admin/ui';
import { formatCurrency } from '@/shared/lib/formatters';
import { adminProductRepository } from '../api/admin-product-repository';
import { adminCategoryRepository } from '@/admin/categories/api/admin-category-repository';
import { adminCollectionRepository } from '@/admin/collections/api/admin-collection-repository';
import { ProductFormModal } from '../components/ProductFormModal';
import type { AdminProduct } from '../types';
import type { AdminCategory } from '@/admin/categories/types';
import type { AdminCollection } from '@/admin/collections/types';
import type { ProductStatus } from '@/entities/product/types';

export const AdminProductsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [collections, setCollections] = useState<AdminCollection[]>([]);

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created_at_desc' | 'created_at_asc' | 'price_desc' | 'price_asc' | 'name_asc'>('created_at_desc');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch taxonomy reference data once
  const loadTaxonomy = useCallback(async () => {
    try {
      const [cats, cols] = await Promise.all([
        adminCategoryRepository.getAllCategories({ active: 'all' }),
        adminCollectionRepository.getAllCollections({ active: 'all' }),
      ]);
      setCategories(cats);
      setCollections(cols);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Taxonomy could not be pre-loaded:', msg);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await adminProductRepository.getProducts({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: statusFilter,
        categoryId: categoryFilter || undefined,
        sortBy,
      });

      setProducts(result.data);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ürünler yüklenirken bir hata oluştu.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, categoryFilter, sortBy]);

  useEffect(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: AdminProduct) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (prod: AdminProduct, newStatus: ProductStatus) => {
    try {
      await adminProductRepository.updateProductStatus(prod.id, newStatus);
      success('Durum Güncellendi', `"${prod.name}" durumu "${newStatus}" olarak ayarlandı.`);
      loadProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ürün durumu güncellenemedi.';
      toastError('Hata', msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    try {
      await adminProductRepository.deleteProduct(deletingProduct.id);
      success('Ürün Silindi', `"${deletingProduct.name}" katalogdan kalıcı olarak kaldırıldı.`);
      setDeletingProduct(null);
      loadProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ürün silinirken bir hata oluştu.';
      toastError('Hata', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryOptions = [
    { label: 'Tüm Kategoriler', value: '' },
    ...categories.map((c) => ({
      label: `${c.name}${!c.active ? ' (Pasif)' : ''}`,
      value: c.id,
    })),
  ];

  const statusOptions = [
    { label: 'Tüm Durumlar', value: 'all' },
    { label: 'Taslak (Draft)', value: 'draft' },
    { label: 'Yayında (Published)', value: 'published' },
    { label: 'Arşivlendi (Archived)', value: 'archived' },
    { label: 'Stokta Yok (Out of stock)', value: 'out_of_stock' },
  ];

  const sortOptions = [
    { label: 'En Yeni Eklenen', value: 'created_at_desc' },
    { label: 'En Eski Eklenen', value: 'created_at_asc' },
    { label: 'Fiyat: Azalan', value: 'price_desc' },
    { label: 'Fiyat: Artan', value: 'price_asc' },
    { label: 'İsim: A-Z', value: 'name_asc' },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Ürün Kataloğu Yönetimi"
        description="Seramik vazo modelleri, fiyatlandırma, perakende/toptan satış yetkileri ve ürün taksonomisi."
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-accent-primary text-text-inverse hover:bg-accent-primary/90 text-xs font-medium transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            Yeni Ürün Ekle
          </button>
        }
      />

      <DataTable
        isLoading={isLoading}
        error={errorMessage}
        onRetry={loadProducts}
        isEmpty={!isLoading && products.length === 0}
        emptyTitle="Kayıtlı ürün bulunamadı"
        emptyDescription="Kriterlerinize uygun ürün bulunamadı veya henüz katalog kaydı yapılmadı."
        emptyAction={
          <button
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-accent-primary text-text-inverse rounded text-xs font-medium hover:bg-accent-primary/90 transition-colors"
          >
            İlk Ürünü Ekle
          </button>
        }
        toolbar={
          <>
            <SearchField
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Ürün adı veya slug ara..."
              className="w-full sm:w-64"
            />

            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label="Durum"
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as ProductStatus | 'all');
                  setPage(1);
                }}
                options={statusOptions}
              />

              <FilterDropdown
                label="Kategori"
                value={categoryFilter}
                onChange={(val) => {
                  setCategoryFilter(val);
                  setPage(1);
                }}
                options={categoryOptions}
              />

              <FilterDropdown
                label="Sıralama"
                value={sortBy}
                onChange={(val) => {
                  setSortBy(val as typeof sortBy);
                  setPage(1);
                }}
                options={sortOptions}
              />
            </div>
          </>
        }
        footer={
          totalPages > 1 ? (
            <div className="p-4 border-t border-border-subtle bg-surface-primary flex items-center justify-between">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                totalItems={totalCount}
              />
            </div>
          ) : null
        }
      >
        <thead>
          <tr className="border-b border-border-subtle bg-surface-secondary/50 text-text-secondary text-[11px] font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Ürün</th>
            <th className="py-3 px-4">Kategori & Malzeme</th>
            <th className="py-3 px-4">Fiyat</th>
            <th className="py-3 px-4">Satış Kanalları</th>
            <th className="py-3 px-4">Durum</th>
            <th className="py-3 px-4 text-right">Eylemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-text-primary text-xs">
          {products.map((product) => {
            const primaryCatName = product.primary_category_id
              ? categoryMap.get(product.primary_category_id) || 'Kategori'
              : '—';

            return (
              <tr key={product.id} className="hover:bg-surface-secondary/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded border border-border-subtle shrink-0 bg-surface-secondary"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded border border-border-subtle bg-surface-secondary flex items-center justify-center shrink-0 text-text-muted">
                        <Package className="w-5 h-5 opacity-40" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5 truncate">
                        <span>{product.name}</span>
                        {product.featured && (
                          <span className="text-[10px] bg-accent-primary/10 text-accent-primary px-1.5 py-0.5 rounded font-medium">
                            Vitrin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-secondary font-mono flex items-center gap-1 mt-0.5">
                        <span>/{product.slug}</span>
                        <a
                          href={`/products/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-text-muted hover:text-text-primary"
                          title="Mağazada Görüntüle"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-text-secondary">
                  <div className="flex items-center gap-1 font-medium text-text-primary">
                    <Layers className="w-3.5 h-3.5 text-text-muted" />
                    <span>{primaryCatName}</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">{product.material}</div>
                </td>

                <td className="py-3.5 px-4 font-mono">
                  <div className="font-semibold text-text-primary">
                    {formatCurrency(product.retail_price)}
                  </div>
                  {product.compare_at_price && (
                    <div className="text-[11px] text-text-muted line-through">
                      {formatCurrency(product.compare_at_price)}
                    </div>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-1 text-[11px]">
                    {product.retail_enabled && (
                      <span className="text-text-secondary">• Perakende (B2C)</span>
                    )}
                    {product.wholesale_enabled && (
                      <span className="text-text-secondary">• Toptan (MOQ: {product.wholesale_moq})</span>
                    )}
                    {!product.retail_enabled && !product.wholesale_enabled && (
                      <span className="text-feedback-error font-medium">Satışa Kapalı</span>
                    )}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={
                        product.status === 'published'
                          ? 'active'
                          : product.status === 'draft'
                          ? 'draft'
                          : product.status === 'archived'
                          ? 'archived'
                          : 'inactive'
                      }
                      label={
                        product.status === 'published'
                          ? 'Yayında'
                          : product.status === 'draft'
                          ? 'Taslak'
                          : product.status === 'archived'
                          ? 'Arşiv'
                          : 'Stokta Yok'
                      }
                    />
                    <select
                      value={product.status}
                      onChange={(e) => handleStatusChange(product, e.target.value as ProductStatus)}
                      aria-label={`${product.name} durumunu değiştir`}
                      className="text-[11px] py-1 px-1.5 rounded border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    >
                      <option value="draft">Taslak</option>
                      <option value="published">Yayında</option>
                      <option value="archived">Arşiv</option>
                      <option value="out_of_stock">Stokta Yok</option>
                    </select>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      aria-label={`${product.name} ürününü düzenle`}
                      title="Düzenle"
                      className="p-1.5 text-text-secondary hover:text-text-primary rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(product)}
                      aria-label={`${product.name} ürününü sil`}
                      title="Sil"
                      className="p-1.5 text-feedback-error/80 hover:text-feedback-error rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      {/* Product Create/Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadProducts}
        initialData={editingProduct}
        categories={categories}
        collections={collections}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingProduct)}
        onCancel={() => setDeletingProduct(null)}
        onConfirm={handleDeleteConfirm}
        title="Ürünü Sil"
        message={`"${deletingProduct?.name}" adlı ürünü kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem ürüne bağlı varyantları, kategori ve koleksiyon ilişkilerini de silecektir.`}
        confirmLabel="Ürünü Sil"
        cancelLabel="Vazgeç"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
