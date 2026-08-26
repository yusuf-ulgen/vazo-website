import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Menu as MenuIcon,
} from 'lucide-react';
import {
  AdminPageHeader,
  StatusBadge,
  ConfirmDialog,
  useToast,
} from '@/admin/ui';
import { adminContentRepository } from '../api/admin-content-repository';
import { HeroSlideEditModal } from '../components/HeroSlideEditModal';
import { WholesaleBenefitModal } from '../components/WholesaleBenefitModal';
import { AdminNavigationTab } from '@/admin/navigation/components/AdminNavigationTab';
import { COMMERCIAL_BENEFIT_ICONS } from '@/site/components/home/commercial-benefit-icons';
import type { AdminHeroSlide, AdminWholesaleBenefit } from '../types';

export function AdminContentPage() {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'hero' | 'benefits' | 'navigation'>('hero');
  const [heroSlides, setHeroSlides] = useState<AdminHeroSlide[]>([]);
  const [benefits, setBenefits] = useState<AdminWholesaleBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hero Modal
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [editingHeroSlide, setEditingHeroSlide] = useState<AdminHeroSlide | null>(null);

  // Benefit Modal
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<AdminWholesaleBenefit | null>(null);

  // Delete Dialog
  const [deletingBenefit, setDeletingBenefit] = useState<AdminWholesaleBenefit | null>(null);
  const [deletingHero, setDeletingHero] = useState<AdminHeroSlide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [slidesData, benefitsData] = await Promise.all([
        adminContentRepository.getHeroSlides(),
        adminContentRepository.getWholesaleBenefits(),
      ]);
      setHeroSlides(slidesData);
      setBenefits(benefitsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'İçerikler yüklenemedi.';
      toastError('Hata', msg);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleHeroActive = async (slide: AdminHeroSlide) => {
    try {
      await adminContentRepository.updateHeroSlide(slide.id, { active: !slide.active });
      success('Başarılı', `Hero slayt ${!slide.active ? 'aktif' : 'pasif'} edildi.`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Durum güncellenemedi.';
      toastError('Hata', msg);
    }
  };

  const handleToggleBenefitActive = async (benefit: AdminWholesaleBenefit) => {
    try {
      await adminContentRepository.updateWholesaleBenefit(benefit.id, { active: !benefit.active });
      success('Başarılı', `Avantaj ${!benefit.active ? 'aktif' : 'pasif'} edildi.`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Durum güncellenemedi.';
      toastError('Hata', msg);
    }
  };

  const handleDeleteBenefitConfirm = async () => {
    if (!deletingBenefit) return;
    setIsDeleting(true);
    try {
      await adminContentRepository.deleteWholesaleBenefit(deletingBenefit.id);
      success('Başarılı', 'Ticari avantaj silindi.');
      setDeletingBenefit(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Silinemedi.';
      toastError('Hata', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteHeroConfirm = async () => {
    if (!deletingHero) return;
    setIsDeleting(true);
    try {
      await adminContentRepository.deleteHeroSlide(deletingHero.id);
      success('Başarılı', 'Hero slayt silindi.');
      setDeletingHero(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Silinemedi.';
      toastError('Hata', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="İçerik & Vitrin Yönetimi (CMS)"
        description="Ana sayfa Split Hero vitrinleri, ticari avantajlar ve gezinme menüleri yönetimi."
        actions={
          activeTab !== 'navigation' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded border border-border-default bg-surface-primary text-text-secondary hover:text-text-primary transition-colors"
                title="Yenile"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {activeTab === 'hero' ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingHeroSlide(null);
                    setIsHeroModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors shadow-subtle"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Hero Ekle</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBenefit(null);
                    setIsBenefitModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors shadow-subtle"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Avantaj Ekle</span>
                </button>
              )}
            </div>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="border-b border-border-default">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'hero'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Split Hero Vitrini</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('benefits')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'benefits'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ticari Avantajlar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('navigation')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'navigation'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <MenuIcon className="w-3.5 h-3.5" />
            <span>Gezinme Menüleri</span>
          </button>
        </nav>
      </div>

      {activeTab === 'navigation' ? (
        <AdminNavigationTab />
      ) : isLoading ? (
        <div className="p-12 text-center text-xs text-text-muted">
          İçerikler yükleniyor...
        </div>
      ) : activeTab === 'hero' ? (
        /* HERO SLIDES TAB */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {heroSlides.map((slide) => {
              const isRetail = slide.slot === 'retail';
              return (
                <div
                  key={slide.id}
                  className={`bg-surface-primary border rounded-lg overflow-hidden shadow-card flex flex-col justify-between transition-all ${
                    slide.active ? 'border-border-default' : 'border-border-default opacity-60 bg-surface-secondary/20'
                  }`}
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative aspect-16/9 bg-surface-secondary overflow-hidden">
                      {slide.image_url ? (
                        <img
                          src={slide.image_url}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded bg-neutral-900/80 text-white uppercase tracking-wider backdrop-blur-xs">
                          {isRetail ? 'Perakende (Sol)' : slide.slot === 'wholesale' ? 'Toptan (Sağ)' : 'Genel'}
                        </span>
                        <StatusBadge
                          status={slide.active ? 'published' : 'archived'}
                          label={slide.active ? 'Yayında' : 'Pasif'}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2.5">
                      {slide.eyebrow && (
                        <span className="text-[10px] uppercase font-bold tracking-editorial text-text-muted block">
                          {slide.eyebrow}
                        </span>
                      )}
                      <h3 className="font-display text-lg font-normal text-text-primary">
                        {slide.title}
                      </h3>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {slide.description}
                      </p>
                      <div className="pt-2 flex items-center gap-2 text-xs font-medium text-accent-primary">
                        <span>{slide.primary_cta_text}</span>
                        <span className="text-text-muted">→</span>
                        <span className="font-mono text-[11px] text-text-muted">{slide.primary_cta_url}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-surface-secondary/40 border-t border-border-subtle flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleHeroActive(slide)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                        slide.active
                          ? 'text-feedback-error hover:bg-feedback-error/10'
                          : 'text-feedback-success hover:bg-feedback-success/10'
                      }`}
                    >
                      {slide.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{slide.active ? 'Pasife Al' : 'Yayına Al'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHeroSlide(slide);
                          setIsHeroModalOpen(true);
                        }}
                        className="p-1.5 rounded border border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingHero(slide)}
                        className="p-1.5 rounded border border-border-default text-feedback-error hover:bg-feedback-error/10 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* WHOLESALE BENEFITS TAB */
        <div className="bg-surface-primary border border-border-default rounded-lg shadow-card overflow-hidden">
          <div className="p-4 border-b border-border-default bg-surface-secondary/30 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Ticari Avantajlar Listesi ({benefits.length})
            </h4>
            <span className="text-[11px] text-text-muted">
              Ana sayfada 5 sütunlu "Neden Vazo Studio?" alanında görüntülenir.
            </span>
          </div>

          <div className="divide-y divide-border-subtle">
            {benefits.map((b) => {
              const IconComp = COMMERCIAL_BENEFIT_ICONS[b.icon_name] || Sparkles;
              return (
                <div
                  key={b.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-surface-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-secondary border border-border-subtle flex items-center justify-center text-text-primary shrink-0">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary">{b.title}</span>
                        <StatusBadge
                          status={b.active ? 'published' : 'archived'}
                          label={b.active ? 'Aktif' : 'Pasif'}
                        />
                        <span className="text-[10px] font-mono text-text-muted">
                          (Sıra: {b.sort_order})
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 max-w-xl">
                        {b.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleBenefitActive(b)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        b.active
                          ? 'text-feedback-error hover:bg-feedback-error/10'
                          : 'text-feedback-success hover:bg-feedback-success/10'
                      }`}
                    >
                      {b.active ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBenefit(b);
                        setIsBenefitModalOpen(true);
                      }}
                      className="p-1.5 rounded border border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingBenefit(b)}
                      className="p-1.5 rounded border border-border-default text-feedback-error hover:bg-feedback-error/10 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Edit Modal */}
      <HeroSlideEditModal
        isOpen={isHeroModalOpen}
        slide={editingHeroSlide}
        onClose={() => setIsHeroModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Benefit Edit Modal */}
      <WholesaleBenefitModal
        isOpen={isBenefitModalOpen}
        benefit={editingBenefit}
        onClose={() => setIsBenefitModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Delete Benefit Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingBenefit)}
        title="Ticari Avantajı Sil"
        message={`"${deletingBenefit?.title}" avantajını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Avantajı Sil"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteBenefitConfirm}
        onCancel={() => setDeletingBenefit(null)}
      />

      {/* Delete Hero Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingHero)}
        title="Hero Vitrinini Sil"
        message={`"${deletingHero?.title}" hero vitrinini silmek istediğinizden emin misiniz?`}
        confirmLabel="Vitrin Sil"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteHeroConfirm}
        onCancel={() => setDeletingHero(null)}
      />
    </div>
  );
}
