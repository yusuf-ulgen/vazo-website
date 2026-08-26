import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShieldCheck, FileText, Truck, AlertCircle } from 'lucide-react';
import { usePolicyDrawer, PolicyTab } from '@/shared/stores/policy-drawer-store';
import { contentRepository, ContentPage as ContentPageType } from '@/entities/content';

export function PolicyBottomSheet() {
  const { isOpen, activeTab, close, setTab } = usePolicyDrawer();
  const [policyData, setPolicyData] = useState<Record<PolicyTab, ContentPageType | null>>({
    privacy: null,
    terms: null,
    shipping: null,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      contentRepository.getPolicyContent(activeTab).then((data) => {
        if (isMounted && data) {
          setPolicyData((prev) => ({ ...prev, [activeTab]: data }));
        }
      }).catch((err) => {
        console.error('[PolicyBottomSheet] Error fetching policy:', err);
      });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const tabs: { id: PolicyTab; label: string; icon: typeof ShieldCheck }[] = [
    { id: 'privacy', label: 'Gizlilik & KVKK', icon: ShieldCheck },
    { id: 'terms', label: 'Kullanım Koşulları', icon: FileText },
    { id: 'shipping', label: 'Teslimat & İade', icon: Truck },
  ];

  const currentData = policyData[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300">
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Bottom Sheet Container (Expansive Standard Size) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Yasal Bilgilendirme ve Politikalar"
        className="relative w-full max-w-6xl h-[85vh] bg-surface-primary rounded-t-2xl shadow-elevated z-10 flex flex-col overflow-hidden animate-slide-up border-t border-border-default text-left mx-auto"
      >
        {/* Drag Handle Bar Indicator */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-14 h-1.5 bg-neutral-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 sm:px-10 py-4 border-b border-border-subtle flex items-center justify-between shrink-0 bg-surface-primary">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-action-primary text-action-primary-text shadow-xs'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={close}
            aria-label="Kapat"
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface-muted shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 text-xs sm:text-sm font-sans text-text-secondary leading-relaxed animate-fade-scale">
          <div className="space-y-6 max-w-5xl">
            <div className="space-y-2 border-b border-border-subtle pb-4">
              <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
                Yasal Bilgilendirme & Sözleşme
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-text-primary font-normal">
                {currentData?.title || (
                  activeTab === 'privacy'
                    ? 'Gizlilik Politikası & KVKK Aydınlatma Metni'
                    : activeTab === 'terms'
                    ? 'Mesafeli Satış & Kullanım Koşulları'
                    : 'Teslimat & İade Koşulları'
                )}
              </h3>
              {currentData?.seoDescription && (
                <p className="text-xs text-text-muted">
                  {currentData.seoDescription}
                </p>
              )}
            </div>

            <div className="p-4 bg-surface-secondary border border-border-default flex items-start gap-3 text-xs text-text-secondary">
              <AlertCircle className="w-4 h-4 text-feedback-info shrink-0 mt-0.5" />
              <p>
                <strong>Hukuki Not:</strong> Bu metinler Vazo Studio kurumsal güvencesi altındadır ve güncel mevzuat standartlarına uygundur.
              </p>
            </div>

            {currentData?.sections && currentData.sections.length > 0 ? (
              <div className="space-y-6">
                {currentData.sections.map((sec, idx) => (
                  <section
                    key={sec.id || idx}
                    className={`space-y-2.5 ${idx > 0 ? 'pt-4 border-t border-border-subtle' : ''}`}
                  >
                    <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">
                      {sec.title}
                    </h4>
                    {sec.content && (
                      <div className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                        {sec.content}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-text-muted">
                İçerik yükleniyor...
              </div>
            )}
          </div>
        </div>

        {/* Footer info in drawer */}
        <div className="px-6 sm:px-10 py-3.5 bg-surface-secondary border-t border-border-subtle flex items-center justify-between text-xs text-text-muted shrink-0">
          <span className="hidden sm:inline">Sorularınız ve kurumsal talepleriniz için müşteri destek ekibimizle görüşebilirsiniz.</span>
          <span className="sm:hidden">Sorularınız için bize ulaşın.</span>
          <Link
            to="/contact"
            onClick={close}
            className="text-text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span>İletişim & Destek</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
