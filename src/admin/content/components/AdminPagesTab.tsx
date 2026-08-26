import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  MoveUp,
  MoveDown,
  Globe,
  Settings,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { adminContentPagesRepository } from '../api/admin-content-pages-repository';
import { ContentPageEditModal } from './ContentPageEditModal';
import { ContentSectionModal } from './ContentSectionModal';
import { ConfirmDialog } from '@/admin/ui';
import type {
  AdminContentPageItem,
  AdminContentSection,
  UpdateContentPageInput,
  CreateContentSectionInput,
  UpdateContentSectionInput,
} from '../types';

export function AdminPagesTab() {
  const [pages, setPages] = useState<AdminContentPageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modals state
  const [isPageEditOpen, setIsPageEditOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<AdminContentSection | null>(null);

  // Delete section confirmation
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminContentPagesRepository.getContentPages();
      setPages(data);
      if (data.length > 0 && !selectedPageId && data[0]) {
        setSelectedPageId(data[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sayfalar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [selectedPageId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const selectedPage = pages.find((p) => p.id === selectedPageId) || pages[0] || null;

  const handleSavePage = async (id: string, input: UpdateContentPageInput) => {
    await adminContentPagesRepository.updateContentPage(id, input);
    showFeedback('Sayfa ayarları başarıyla güncellendi.');
    await fetchPages();
  };

  const handleSaveSection = async (
    input: CreateContentSectionInput | UpdateContentSectionInput,
    sectionId?: string
  ) => {
    if (sectionId) {
      await adminContentPagesRepository.updateContentSection(sectionId, input as UpdateContentSectionInput);
      showFeedback('İçerik bölümü güncellendi.');
    } else {
      await adminContentPagesRepository.createContentSection(input as CreateContentSectionInput);
      showFeedback('Yeni içerik bölümü eklendi.');
    }
    await fetchPages();
  };

  const handleDeleteSection = async () => {
    if (!deletingSectionId) return;
    try {
      await adminContentPagesRepository.deleteContentSection(deletingSectionId);
      showFeedback('İçerik bölümü silindi.');
      setDeletingSectionId(null);
      await fetchPages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bölüm silinemedi.');
    }
  };

  const handleToggleSectionActive = async (sec: AdminContentSection) => {
    try {
      await adminContentPagesRepository.updateContentSection(sec.id, { active: !sec.active });
      await fetchPages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi.');
    }
  };

  const handleMoveSection = async (sec: AdminContentSection, direction: 'up' | 'down') => {
    if (!selectedPage || !selectedPage.sections) return;
    const sorted = [...selectedPage.sections].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((s) => s.id === sec.id);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];
    if (!current || !target) return;

    const currentSort = current.sort_order;
    const targetSort = target.sort_order;

    try {
      await adminContentPagesRepository.reorderContentSections([
        { id: current.id, sort_order: targetSort },
        { id: target.id, sort_order: currentSort },
      ]);
      await fetchPages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sıralama güncellenemedi.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3 bg-feedback-success/10 border border-feedback-success/20 text-feedback-success rounded-md text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 text-feedback-error rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pages Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border-subtle">
        {pages.map((p) => {
          const isSelected = selectedPage?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPageId(p.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                isSelected
                  ? 'bg-action-primary text-action-primary-text shadow-xs'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{p.title}</span>
              {!p.published && (
                <span className="px-1.5 py-0.2 bg-feedback-warning/20 text-feedback-warning rounded text-[10px]">
                  Taslak
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && pages.length === 0 ? (
        <div className="p-12 text-center text-text-muted flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>İçerik sayfaları yükleniyor...</span>
        </div>
      ) : selectedPage ? (
        <div className="space-y-6">
          {/* Page Details Card */}
          <div className="p-6 bg-surface-primary border border-border-subtle rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-text-primary">
                  {selectedPage.title}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    selectedPage.published
                      ? 'bg-feedback-success/10 text-feedback-success border border-feedback-success/20'
                      : 'bg-feedback-warning/10 text-feedback-warning border border-feedback-warning/20'
                  }`}
                >
                  {selectedPage.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {selectedPage.published ? 'Yayında' : 'Taslak'}
                </span>
              </div>
              <p className="text-xs text-text-muted font-mono">
                Anahtar: {selectedPage.page_key}
              </p>
              {selectedPage.seo_title && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-1">
                  <Globe className="w-3.5 h-3.5 text-text-muted" />
                  <span className="truncate max-w-lg">{selectedPage.seo_title}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPageEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-secondary hover:bg-surface-muted text-text-primary text-xs font-semibold rounded-lg border border-border-default transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>SEO & Bilgileri Düzenle</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingSection(null);
                  setIsSectionModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-action-primary hover:bg-neutral-800 text-action-primary-text text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Bölüm Ekle</span>
              </button>
            </div>
          </div>

          {/* Sections List */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-semibold tracking-wider text-text-secondary">
              Yapılandırılmış Bölümler ({selectedPage.sections?.length || 0})
            </h4>

            {(!selectedPage.sections || selectedPage.sections.length === 0) ? (
              <div className="p-8 text-center bg-surface-secondary/40 border border-dashed border-border-default rounded-xl text-text-muted text-xs">
                Bu sayfada henüz içerik bölümü eklenmemiş. "Yeni Bölüm Ekle" butonuna tıklayarak ilk bölümü oluşturabilirsiniz.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle bg-surface-primary border border-border-subtle rounded-xl overflow-hidden shadow-xs">
                {selectedPage.sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface-secondary/30 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <span className="w-6 h-6 rounded-full bg-surface-secondary text-text-muted flex items-center justify-center text-xs font-mono font-medium shrink-0 mt-0.5">
                        {sec.sort_order}
                      </span>

                      {sec.image_url && (
                        <img
                          src={sec.image_url}
                          alt={sec.title}
                          className="w-14 h-14 object-cover rounded border border-border-subtle shrink-0 hidden sm:block"
                        />
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {sec.eyebrow && (
                            <span className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                              {sec.eyebrow}
                            </span>
                          )}
                          <span className="text-xs font-mono text-text-muted">
                            [{sec.section_key}]
                          </span>
                        </div>

                        <h5 className="text-sm font-medium text-text-primary">
                          {sec.title}
                        </h5>

                        {sec.content && (
                          <p className="text-xs text-text-secondary line-clamp-2 max-w-2xl leading-relaxed">
                            {sec.content}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleSectionActive(sec)}
                        className={`p-1.5 rounded text-xs font-medium transition-colors ${
                          sec.active
                            ? 'text-feedback-success hover:bg-feedback-success/10'
                            : 'text-text-muted hover:bg-surface-muted'
                        }`}
                        title={sec.active ? 'Aktif' : 'Pasif'}
                      >
                        {sec.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSection(sec, 'up')}
                        className="p-1.5 text-text-secondary hover:text-text-primary disabled:opacity-30 rounded hover:bg-surface-muted transition-colors"
                        title="Yukarı Taşı"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === (selectedPage.sections?.length || 0) - 1}
                        onClick={() => handleMoveSection(sec, 'down')}
                        className="p-1.5 text-text-secondary hover:text-text-primary disabled:opacity-30 rounded hover:bg-surface-muted transition-colors"
                        title="Aşağı Taşı"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSection(sec);
                          setIsSectionModalOpen(true);
                        }}
                        className="p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-surface-muted transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setDeletingSectionId(sec.id)}
                        className="p-1.5 text-feedback-error hover:bg-feedback-error/10 rounded transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Page Edit Modal */}
      <ContentPageEditModal
        page={selectedPage}
        isOpen={isPageEditOpen}
        onClose={() => setIsPageEditOpen(false)}
        onSave={handleSavePage}
      />

      {/* Section Modal */}
      {selectedPage && (
        <ContentSectionModal
          pageId={selectedPage.id}
          section={editingSection}
          isOpen={isSectionModalOpen}
          onClose={() => setIsSectionModalOpen(false)}
          onSave={handleSaveSection}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingSectionId)}
        title="İçerik Bölümünü Sil"
        message="Bu içerik bölümünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        isDestructive
        onConfirm={handleDeleteSection}
        onCancel={() => setDeletingSectionId(null)}
      />
    </div>
  );
}
