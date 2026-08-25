import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { AdminCategory, CreateCategoryInput, UpdateCategoryInput } from '../types';
import { adminCategoryRepository } from '../api/admin-category-repository';
import { CategoryFormModal } from '../components/CategoryFormModal';
import {
  AdminPageHeader,
  DataTable,
  SearchField,
  FilterDropdown,
  StatusBadge,
  ConfirmDialog,
  useToast,
} from '@/admin/ui';

export function AdminCategoriesPage() {
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);

  // Delete state
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeParam =
        statusFilter === 'all' ? 'all' : statusFilter === 'active' ? true : false;
      const data = await adminCategoryRepository.getAllCategories({
        search: search.trim() || undefined,
        active: activeParam,
      });
      setCategories(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kategoriler yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category: AdminCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (input: CreateCategoryInput | UpdateCategoryInput) => {
    if (selectedCategory) {
      await adminCategoryRepository.updateCategory(selectedCategory.id, input);
      success(`"${input.name || selectedCategory.name}" kategorisi başarıyla güncellendi.`);
    } else {
      await adminCategoryRepository.createCategory(input as CreateCategoryInput);
      success(`"${input.name}" kategorisi başarıyla oluşturuldu.`);
    }
    await fetchCategories();
  };

  const handleToggleActive = async (category: AdminCategory) => {
    try {
      const updated = await adminCategoryRepository.toggleCategoryActive(category.id, !category.active);
      success(
        `"${category.name}" kategorisi ${updated.active ? 'yayına alındı' : 'pasife alındı'}.`
      );
      await fetchCategories();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Durum güncellenemedi.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await adminCategoryRepository.deleteCategory(categoryToDelete.id);
      success(`"${categoryToDelete.name}" kategorisi kalıcı olarak silindi.`);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Kategori silinemedi.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Map parent id to parent name
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <AdminPageHeader
        title="Kategori Yönetimi"
        description="Ürünlerin gruplandığı ana ve alt kategorileri, vitrin görsellerini ve hiyerarşiyi yönetin."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Kategoriler' },
        ]}
        badge={<StatusBadge status="active" label={`${categories.length} Kategori`} />}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-action-primary text-action-primary-text hover:bg-neutral-800 rounded transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Kategori</span>
          </button>
        }
      />

      <DataTable
        isLoading={isLoading}
        error={error}
        onRetry={fetchCategories}
        isEmpty={categories.length === 0}
        emptyTitle="Kategori bulunamadı"
        emptyDescription={
          search || statusFilter !== 'all'
            ? 'Arama kriterlerinize uygun kategori bulunamadı.'
            : 'Henüz sisteme eklenmiş bir kategori bulunmuyor.'
        }
        emptyAction={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-action-primary text-action-primary-text rounded transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>İlk Kategoriyi Ekle</span>
          </button>
        }
        toolbar={
          <>
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Kategori adı veya slug ara..."
              className="w-full sm:w-72"
            />

            <div className="flex items-center gap-2">
              <FilterDropdown
                label="Durum Filtresi"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
                options={[
                  { label: 'Tüm Durumlar', value: 'all' },
                  { label: 'Aktif / Yayında', value: 'active' },
                  { label: 'Pasif / Taslak', value: 'inactive' },
                ]}
              />
            </div>
          </>
        }
      >
        <thead>
          <tr className="border-b border-border-subtle bg-surface-secondary/50 text-text-secondary text-[11px] font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Kategori Adı</th>
            <th className="py-3 px-4">Slug (URL)</th>
            <th className="py-3 px-4">Üst Kategori</th>
            <th className="py-3 px-4 text-center">Sıra</th>
            <th className="py-3 px-4">Durum</th>
            <th className="py-3 px-4 text-right">Eylemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-text-primary text-xs">
          {categories.map((item) => (
            <tr key={item.id} className="hover:bg-surface-secondary/40 transition-colors">
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-surface-secondary border border-border-subtle overflow-hidden shrink-0 flex items-center justify-center text-text-muted">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Layers className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary block">{item.name}</span>
                    {item.description && (
                      <span className="text-[11px] text-text-muted line-clamp-1 max-w-xs">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-4 font-mono text-text-secondary text-[11px]">
                /{item.slug}
              </td>
              <td className="py-3.5 px-4 text-text-secondary">
                {item.parent_id ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-primary">
                    <span className="text-text-muted">↳</span>
                    {categoryMap.get(item.parent_id) || 'Üst Kategori'}
                  </span>
                ) : (
                  <span className="text-text-muted text-[11px]">Ana Kategori</span>
                )}
              </td>
              <td className="py-3.5 px-4 text-center font-mono text-text-secondary">
                {item.sort_order}
              </td>
              <td className="py-3.5 px-4">
                <StatusBadge
                  status={item.active ? 'published' : 'draft'}
                  label={item.active ? 'Aktif' : 'Pasif'}
                />
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleToggleActive(item)}
                    title={item.active ? 'Pasife Al' : 'Yayına Al'}
                    aria-label={item.active ? 'Pasife Al' : 'Yayına Al'}
                    className="p-1.5 text-text-secondary hover:text-text-primary rounded transition-colors"
                  >
                    {item.active ? (
                      <CheckCircle2 className="w-4 h-4 text-feedback-success" />
                    ) : (
                      <XCircle className="w-4 h-4 text-text-muted" />
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    title="Düzenle"
                    aria-label={`${item.name} kategorisini düzenle`}
                    className="p-1.5 text-text-secondary hover:text-text-primary rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCategoryToDelete(item)}
                    title="Sil"
                    aria-label={`${item.name} kategorisini sil`}
                    className="p-1.5 text-text-secondary hover:text-feedback-danger rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      {/* Create / Edit Modal */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
        allCategories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        title="Kategoriyi Sil"
        message={
          <span>
            <strong>&quot;{categoryToDelete?.name}&quot;</strong> kategorisini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </span>
        }
        confirmLabel="Kategoriyi Sil"
        cancelLabel="Vazgeç"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
