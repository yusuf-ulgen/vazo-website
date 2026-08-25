import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  AlertTriangle,
  XCircle,
  Layers,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import {
  AdminPageHeader,
  DataTable,
  SearchField,
  FilterDropdown,
  Pagination,
  AdminCard,
  StatusBadge,
} from '@/admin/ui';
import { adminInventoryRepository } from '../api/admin-inventory-repository';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import { formatCurrency } from '@/shared/lib/formatters';
import type {
  AdminInventoryItem,
  StockFilter,
  AdminInventoryListResult,
} from '../types';

export const AdminInventoryPage: React.FC = () => {
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [metrics, setMetrics] = useState<AdminInventoryListResult['metrics']>({
    totalVariants: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalUnits: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<AdminInventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await adminInventoryRepository.getInventory({
        page,
        pageSize,
        search: search.trim() || undefined,
        stockFilter,
      });

      setItems(result.data);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setMetrics(result.metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Envanter yüklenirken bir hata oluştu.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, stockFilter]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleOpenEditStock = (item: AdminInventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filterOptions = [
    { value: 'all', label: 'Tüm Stoklar' },
    { value: 'in_stock', label: 'Stokta Var (>0)' },
    { value: 'low_stock', label: 'Kritik Stok (≤ 5 Adet)' },
    { value: 'out_of_stock', label: 'Tükendi (0 Adet)' },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Stok ve Envanter Yönetimi"
        description="Ürün varyantları (SKU) bazında anlık stok adetleri, kritik stok eşikleri ve hızlı miktar ayarlamaları."
        actions={
          <button
            type="button"
            onClick={loadInventory}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        }
      />

      {/* High-level Stock Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard className="p-4 border-l-4 border-l-accent-primary">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-text-secondary block">Toplam Varyant</span>
              <span className="text-2xl font-bold font-mono text-text-primary">{metrics.totalVariants}</span>
            </div>
            <Layers className="w-6 h-6 text-accent-primary opacity-80" />
          </div>
        </AdminCard>

        <AdminCard className="p-4 border-l-4 border-l-feedback-success">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-text-secondary block">Toplam Envanter Adedi</span>
              <span className="text-2xl font-bold font-mono text-feedback-success">{metrics.totalUnits}</span>
            </div>
            <Package className="w-6 h-6 text-feedback-success opacity-80" />
          </div>
        </AdminCard>

        <AdminCard className="p-4 border-l-4 border-l-feedback-warning">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-text-secondary block">Kritik Stok (≤ 5)</span>
              <span className="text-2xl font-bold font-mono text-feedback-warning">{metrics.lowStockCount}</span>
            </div>
            <AlertTriangle className="w-6 h-6 text-feedback-warning opacity-80" />
          </div>
        </AdminCard>

        <AdminCard className="p-4 border-l-4 border-l-feedback-error">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-text-secondary block">Tükenen Varyantlar (0)</span>
              <span className="text-2xl font-bold font-mono text-feedback-error">{metrics.outOfStockCount}</span>
            </div>
            <XCircle className="w-6 h-6 text-feedback-error opacity-80" />
          </div>
        </AdminCard>
      </div>

      <DataTable
        isLoading={isLoading}
        isEmpty={items.length === 0}
        emptyTitle="Envanter kaydı bulunamadı"
        emptyDescription="Arama kriterlerinize uygun envanter kaydı bulunamadı."
        error={errorMessage}
        onRetry={loadInventory}
        toolbar={
          <>
            <SearchField
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="SKU, ürün adı veya renk ara..."
            />

            <FilterDropdown
              label="Stok Durumu"
              value={stockFilter}
              onChange={(val) => {
                setStockFilter(val as StockFilter);
                setPage(1);
              }}
              options={filterOptions}
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
            <th className="py-3 px-4">SKU / Varyant</th>
            <th className="py-3 px-4">Bağlı Ürün</th>
            <th className="py-3 px-4">Renk & Boyut</th>
            <th className="py-3 px-4">Fiyat</th>
            <th className="py-3 px-4">Stok Miktarı</th>
            <th className="py-3 px-4">Durum</th>
            <th className="py-3 px-4 text-right">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-text-primary">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
              <td className="py-3 px-4">
                <span className="font-mono font-semibold text-text-primary block">{item.sku}</span>
                <span className="text-[11px] text-text-secondary">{item.variant_name}</span>
              </td>

              <td className="py-3 px-4">
                <span className="font-medium text-text-primary block">{item.product_name}</span>
              </td>

              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  {item.color_hex && (
                    <span
                      className="w-3 h-3 rounded-full border border-border-default shrink-0 inline-block"
                      style={{ backgroundColor: item.color_hex }}
                    />
                  )}
                  <span>{item.color_name}</span>
                </div>
                {item.size_label && (
                  <span className="text-[10px] text-text-muted block mt-0.5">{item.size_label}</span>
                )}
              </td>

              <td className="py-3 px-4 font-mono font-medium">
                {formatCurrency(item.retail_price)}
              </td>

              <td className="py-3 px-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border">
                  {item.stock_quantity === 0 ? (
                    <span className="text-feedback-error bg-feedback-error/10 border-feedback-error/20 px-2 py-0.5 rounded">
                      0 Adet (Tükendi)
                    </span>
                  ) : item.stock_quantity <= 5 ? (
                    <span className="text-feedback-warning bg-feedback-warning/10 border-feedback-warning/20 px-2 py-0.5 rounded">
                      {item.stock_quantity} Adet (Kritik)
                    </span>
                  ) : (
                    <span className="text-feedback-success bg-feedback-success/10 border-feedback-success/20 px-2 py-0.5 rounded">
                      {item.stock_quantity} Adet
                    </span>
                  )}
                </div>
              </td>

              <td className="py-3 px-4">
                <StatusBadge
                  status={item.active ? 'active' : 'inactive'}
                  label={item.active ? 'Aktif' : 'Pasif'}
                />
              </td>

              <td className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleOpenEditStock(item)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-border-default hover:bg-surface-secondary text-text-primary transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Güncelle</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <StockAdjustmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadInventory}
        item={editingItem}
      />
    </div>
  );
};
