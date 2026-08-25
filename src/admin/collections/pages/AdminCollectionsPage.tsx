import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Sparkles, CheckCircle2, XCircle, Star } from 'lucide-react';
import { AdminCollection, CreateCollectionInput, UpdateCollectionInput } from '../types';
import { adminCollectionRepository } from '../api/admin-collection-repository';
import { CollectionFormModal } from '../components/CollectionFormModal';
import {
  AdminPageHeader,
  DataTable,
  SearchField,
  FilterDropdown,
  StatusBadge,
  ConfirmDialog,
  useToast,
} from '@/admin/ui';

export function AdminCollectionsPage() {
  const { success, error: toastError } = useToast();

  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'standard'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<AdminCollection | null>(null);

  // Delete state
  const [collectionToDelete, setCollectionToDelete] = useState<AdminCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeParam =
        statusFilter === 'all' ? 'all' : statusFilter === 'active' ? true : false;
      const featuredParam =
        featuredFilter === 'all' ? 'all' : featuredFilter === 'featured' ? true : false;

      const data = await adminCollectionRepository.getAllCollections({
        search: search.trim() || undefined,
        active: activeParam,
        featured: featuredParam,
      });
      setCollections(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Koleksiyonlar yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, featuredFilter]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleOpenCreate = () => {
    setSelectedCollection(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (collection: AdminCollection) => {
    setSelectedCollection(collection);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (input: CreateCollectionInput | UpdateCollectionInput) => {
    if (selectedCollection) {
      await adminCollectionRepository.updateCollection(selectedCollection.id, input);
      success(`"${input.name || selectedCollection.name}" koleksiyonu başarıyla güncellendi.`);
    } else {
      await adminCollectionRepository.createCollection(input as CreateCollectionInput);
      success(`"${input.name}" koleksiyonu başarıyla oluşturuldu.`);
    }
    await fetchCollections();
  };

  const handleToggleActive = async (collection: AdminCollection) => {
    try {
      const updated = await adminCollectionRepository.toggleCollectionActive(collection.id, !collection.active);
      success(
        `"${collection.name}" koleksiyonu ${updated.active ? 'yayına alındı' : 'pasife alındı'}.`
      );
      await fetchCollections();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Durum güncellenemedi.');
    }
  };

  const handleToggleFeatured = async (collection: AdminCollection) => {
    try {
      const updated = await adminCollectionRepository.toggleCollectionFeatured(
        collection.id,
        !collection.featured
      );
      success(
        `"${collection.name}" ${updated.featured ? 'ana sayfada öne çıkarıldı' : 'vitrinden kaldırıldı'}.`
      );
      await fetchCollections();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Vitrin durumu güncellenemedi.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!collectionToDelete) return;
    setIsDeleting(true);
    try {
      await adminCollectionRepository.deleteCollection(collectionToDelete.id);
      success(`"${collectionToDelete.name}" koleksiyonu kalıcı olarak silindi.`);
      setCollectionToDelete(null);
      await fetchCollections();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Koleksiyon silinemedi.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <AdminPageHeader
        title="Koleksiyon Kürasyonu"
        description="Sezonluk tematik seramik koleksiyonlarını, editoryal hikayeleri ve vitrin kürasyonunu yönetin."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Koleksiyonlar' },
        ]}
        badge={<StatusBadge status="active" label={`${collections.length} Koleksiyon`} />}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-action-primary text-action-primary-text hover:bg-neutral-800 rounded transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Koleksiyon</span>
          </button>
        }
      />

      <DataTable
        isLoading={isLoading}
        error={error}
        onRetry={fetchCollections}
        isEmpty={collections.length === 0}
        emptyTitle="Koleksiyon bulunamadı"
        emptyDescription={
          search || statusFilter !== 'all' || featuredFilter !== 'all'
            ? 'Arama kriterlerinize uygun koleksiyon bulunamadı.'
            : 'Henüz sisteme eklenmiş bir koleksiyon bulunmuyor.'
        }
        emptyAction={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-action-primary text-action-primary-text rounded transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>İlk Koleksiyonu Ekle</span>
          </button>
        }
        toolbar={
          <>
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Koleksiyon adı, slug veya alt başlık ara..."
              className="w-full sm:w-72"
            />

            <div className="flex items-center gap-2 flex-wrap">
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

              <FilterDropdown
                label="Vitrin Filtresi"
                value={featuredFilter}
                onChange={(val) => setFeaturedFilter(val as 'all' | 'featured' | 'standard')}
                options={[
                  { label: 'Tüm Vitrin', value: 'all' },
                  { label: 'Öne Çıkarılanlar', value: 'featured' },
                  { label: 'Standart', value: 'standard' },
                ]}
              />
            </div>
          </>
        }
      >
        <thead>
          <tr className="border-b border-border-subtle bg-surface-secondary/50 text-text-secondary text-[11px] font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Koleksiyon Adı</th>
            <th className="py-3 px-4">Slug (URL)</th>
            <th className="py-3 px-4 text-center">Vitrin</th>
            <th className="py-3 px-4 text-center">Sıra</th>
            <th className="py-3 px-4">Durum</th>
            <th className="py-3 px-4 text-right">Eylemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-text-primary text-xs">
          {collections.map((item) => (
            <tr key={item.id} className="hover:bg-surface-secondary/40 transition-colors">
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded bg-surface-secondary border border-border-subtle overflow-hidden shrink-0 flex items-center justify-center text-text-muted">
                    {item.hero_image_url ? (
                      <img
                        src={item.hero_image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary block">{item.name}</span>
                    {item.subtitle && (
                      <span className="text-[11px] text-text-muted line-clamp-1 max-w-xs">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-4 font-mono text-text-secondary text-[11px]">
                /{item.slug}
              </td>
              <td className="py-3.5 px-4 text-center">
                <button
                  onClick={() => handleToggleFeatured(item)}
                  title={item.featured ? 'Vitrinden Kaldır' : 'Ana Sayfada Öne Çıkar'}
                  aria-label={item.featured ? 'Vitrinden Kaldır' : 'Ana Sayfada Öne Çıkar'}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-4 h-4 ${
                      item.featured
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  />
                </button>
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
                    aria-label={`${item.name} koleksiyonunu düzenle`}
                    className="p-1.5 text-text-secondary hover:text-text-primary rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCollectionToDelete(item)}
                    title="Sil"
                    aria-label={`${item.name} koleksiyonunu sil`}
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
      <CollectionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        collection={selectedCollection}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(collectionToDelete)}
        title="Koleksiyonu Sil"
        message={
          <span>
            <strong>&quot;{collectionToDelete?.name}&quot;</strong> koleksiyonunu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </span>
        }
        confirmLabel="Koleksiyonu Sil"
        cancelLabel="Vazgeç"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCollectionToDelete(null)}
      />
    </div>
  );
}
