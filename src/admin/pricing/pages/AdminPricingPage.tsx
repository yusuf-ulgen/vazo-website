import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Edit3, Tag } from 'lucide-react';
import {
  AdminPageHeader,
  DataTable,
  SearchField,
  FilterDropdown,
  Pagination,
} from '@/admin/ui';
import { adminPricingRepository } from '../api/admin-pricing-repository';
import { adminCategoryRepository } from '@/admin/categories/api/admin-category-repository';
import { PriceEditModal } from '../components/PriceEditModal';
import { formatCurrency } from '@/shared/lib/formatters';
import type { AdminPricingItem } from '../types';
import type { AdminCategory } from '@/admin/categories/types';

export const AdminPricingPage: React.FC = () => {
  const [items, setItems] = useState<AdminPricingItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<AdminPricingItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await adminCategoryRepository.getAllCategories({ active: 'all' });
      setCategories(cats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Kategoriler yüklenemedi:', msg);
    }
  }, []);

  const loadPricing = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await adminPricingRepository.getPricingList({
        page,
        pageSize,
        search: search.trim() || undefined,
        categoryId: categoryFilter,
      });

      setItems(result.data);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fiyat listesi yüklenemedi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, categoryFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  const handleOpenEdit = (item: AdminPricingItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const categoryOptions = [
    { value: 'all', label: 'Tüm Kategoriler' },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Fiyatlandırma Matrisi"
        description="Katalogdaki ana ürünler ve SKU varyantları için perakende satış fiyatları ve indirim öncesi referans fiyatları."
        actions={
          <button
            type="button"
            onClick={loadPricing}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        }
      />

      <DataTable
        isLoading={isLoading}
        isEmpty={items.length === 0}
        emptyTitle="Fiyat kaydı bulunamadı"
        emptyDescription="Arama kriterlerinize uygun fiyat kaydı bulunamadı."
        error={errorMessage}
        onRetry={loadPricing}
        toolbar={
          <>
            <SearchField
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Ürün adı, slug veya varyant ara..."
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
          </>
        }
        footer={
          totalPages > 1 ? (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          ) : undefined
        }
      >
        <thead>
          <tr className="bg-surface-secondary/50 border-b border-border-subtle text-text-secondary uppercase text-[11px] font-semibold">
            <th className="py-3 px-4">Başlık / Model</th>
            <th className="py-3 px-4">Tip</th>
            <th className="py-3 px-4">Kategori</th>
            <th className="py-3 px-4">Satış Fiyatı</th>
            <th className="py-3 px-4">Eski Liste Fiyatı</th>
            <th className="py-3 px-4">İndirim Oranı</th>
            <th className="py-3 px-4">Kanallar</th>
            <th className="py-3 px-4 text-right">Eylem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-text-primary">
          {items.map((item) => {
            const hasDiscount =
              item.compareAtPrice !== null && item.compareAtPrice > item.retailPrice;
            const discountRate = hasDiscount
              ? Math.round(((item.compareAtPrice! - item.retailPrice) / item.compareAtPrice!) * 100)
              : 0;

            return (
              <tr key={`${item.type}-${item.id}`} className="hover:bg-surface-secondary/30 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-semibold text-text-primary block">{item.name}</span>
                  {item.sku && (
                    <span className="font-mono text-[11px] text-text-muted block mt-0.5">
                      SKU: {item.sku}
                    </span>
                  )}
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                      item.type === 'product'
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'bg-surface-secondary text-text-secondary border border-border-subtle'
                    }`}
                  >
                    {item.type === 'product' ? 'Ana Ürün' : 'Varyant (SKU)'}
                  </span>
                </td>

                <td className="py-3 px-4 text-text-secondary">{item.categoryName}</td>

                <td className="py-3 px-4 font-mono font-bold text-text-primary">
                  {formatCurrency(item.retailPrice)}
                </td>

                <td className="py-3 px-4 font-mono text-text-muted">
                  {item.compareAtPrice !== null ? (
                    <span className="line-through">{formatCurrency(item.compareAtPrice)}</span>
                  ) : (
                    '—'
                  )}
                </td>

                <td className="py-3 px-4">
                  {hasDiscount ? (
                    <span className="inline-flex items-center gap-1 text-feedback-success font-semibold text-xs bg-feedback-success/10 px-2 py-0.5 rounded">
                      <Tag className="w-3 h-3" />
                      %{discountRate} İndirim
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  <div className="flex gap-1.5 text-[10px]">
                    {item.retailEnabled && (
                      <span className="px-1.5 py-0.5 rounded bg-surface-secondary text-text-primary border border-border-subtle font-medium">
                        B2C
                      </span>
                    )}
                    {item.wholesaleEnabled && (
                      <span className="px-1.5 py-0.5 rounded bg-accent-primary/15 text-accent-primary font-medium">
                        B2B
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-border-default hover:bg-surface-secondary text-text-primary transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Düzenle</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      <PriceEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadPricing}
        item={editingItem}
      />
    </div>
  );
};
