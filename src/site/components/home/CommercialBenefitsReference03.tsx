import { useState, useEffect } from 'react';
import { Tag, AlertCircle, RefreshCw } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { contentRepository } from '@/entities/content/api/content-repository';
import { COMMERCIAL_BENEFIT_ICONS } from './commercial-benefit-icons';
import type { WholesaleBenefit } from '@/entities/content/types';

export function CommercialBenefitsReference03() {
  const [benefits, setBenefits] = useState<WholesaleBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBenefits = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await contentRepository.getWholesaleBenefits();
      setBenefits(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ticari avantajlar yüklenemedi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBenefits();
  }, []);

  if (errorMessage) {
    return (
      <section className="w-full bg-canvas-default py-10 px-4 border-b border-border-subtle text-center">
        <div className="max-w-md mx-auto p-4 bg-feedback-error/10 border border-feedback-error/20 rounded text-feedback-error text-xs space-y-2">
          <AlertCircle className="w-5 h-5 mx-auto" />
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={loadBenefits}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-feedback-error text-white hover:bg-feedback-error/90 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Tekrar Dene</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-canvas-default py-12 md:py-16 border-b border-border-subtle">
      <Container size="full" className="max-w-[1536px] px-4 sm:px-8 lg:px-12">
        {/* Section Header (Reference 03) */}
        <div className="text-center max-w-xl mx-auto space-y-1 mb-10 md:mb-12">
          <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
            NEDEN VAZO STUDIO?
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-text-primary">
            Ticari Avantajlarınız
          </h2>
        </div>

        {/* 4-Column Grid with delicate vertical dividers & balanced 5-space margins */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-surface-secondary/40 animate-pulse rounded" />
            ))}
          </div>
        ) : benefits.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted border border-dashed border-border-subtle rounded">
            Ticari avantaj bilgisi bulunamadı.
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${benefits.length === 4 ? 'lg:grid-cols-4' : benefits.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-5'} divide-y sm:divide-y-0 lg:divide-x divide-border-subtle`}>
            {benefits.map((b) => {
              const Icon = COMMERCIAL_BENEFIT_ICONS[b.iconName] || Tag;
              return (
                <div
                  key={b.id || b.title}
                  className="flex flex-col items-center text-center px-6 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-secondary border border-border-subtle flex items-center justify-center text-text-primary mb-1 shadow-xs">
                    <Icon className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <h3 className="font-sans text-xs font-semibold text-text-primary tracking-wide">
                    {b.title}
                  </h3>
                  <p className="text-[11px] text-text-secondary font-sans leading-relaxed max-w-[220px]">
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
