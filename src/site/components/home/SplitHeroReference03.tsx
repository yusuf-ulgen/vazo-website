import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { contentRepository } from '@/entities/content/api/content-repository';
import type { SplitHeroConfig } from '@/entities/content/types';

export function SplitHeroReference03() {
  const [splitHero, setSplitHero] = useState<SplitHeroConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHero = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await contentRepository.getSplitHero();
      setSplitHero(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hero banner yüklenemedi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHero();
  }, []);

  if (isLoading) {
    return (
      <section className="w-full bg-canvas-default border-b border-border-subtle overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] bg-surface-secondary/40 animate-pulse border-b lg:border-b-0 lg:border-r border-border-subtle" />
          <div className="min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] bg-surface-secondary/30 animate-pulse" />
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="w-full bg-canvas-default py-12 px-6 border-b border-border-subtle text-center">
        <div className="max-w-md mx-auto p-6 bg-feedback-error/10 border border-feedback-error/20 rounded-lg text-feedback-error space-y-3">
          <AlertCircle className="w-6 h-6 mx-auto" />
          <p className="text-xs">{errorMessage}</p>
          <button
            type="button"
            onClick={loadHero}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-feedback-error text-white hover:bg-feedback-error/90 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tekrar Dene</span>
          </button>
        </div>
      </section>
    );
  }

  const retail = splitHero?.retail;
  const wholesale = splitHero?.wholesale;

  return (
    <section className="w-full bg-canvas-default border-b border-border-subtle overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: BİREYSEL ALIŞVERİŞ (Perakende) */}
        {retail && retail.active ? (
          <div className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex flex-col justify-center p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden group">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={retail.imageUrl}
                alt={retail.title || 'Perakende Vazo Koleksiyonu'}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-canvas-default/60 via-transparent to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 space-y-4 max-w-md text-left">
              {retail.eyebrow && (
                <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                  {retail.eyebrow}
                </span>
              )}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-text-primary leading-tight">
                {retail.title}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal max-w-sm">
                {retail.description}
              </p>
              <div className="pt-3">
                <Link
                  to={retail.primaryCtaUrl || '/products'}
                  className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-7 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  <span>{retail.primaryCtaText || 'Alışverişe Başla'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center justify-center p-8 border-b lg:border-b-0 lg:border-r border-border-subtle bg-surface-secondary/20 text-xs text-text-muted">
            Perakende vitrini şu anda devre dışı.
          </div>
        )}

        {/* Right: PROFESYONEL ALIŞVERİŞ (Toptan) */}
        {wholesale && wholesale.active ? (
          <div className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex flex-col justify-center p-8 sm:p-12 lg:p-16 overflow-hidden group">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={wholesale.imageUrl}
                alt={wholesale.title || 'Toptan Seramik Proje ve Mimari Çözümler'}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-canvas-default/60 via-transparent to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 space-y-4 max-w-md text-left">
              {wholesale.eyebrow && (
                <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                  {wholesale.eyebrow}
                </span>
              )}
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-text-primary leading-tight">
                {wholesale.title}
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal max-w-sm">
                {wholesale.description}
              </p>
              <div className="pt-3">
                <Link
                  to={wholesale.primaryCtaUrl || '/wholesale'}
                  className="inline-flex items-center gap-2 border border-text-primary bg-surface-primary/90 text-text-primary hover:bg-action-primary hover:text-action-primary-text px-7 py-3.5 text-xs uppercase font-semibold tracking-wider transition-colors shadow-xs"
                >
                  <span>{wholesale.primaryCtaText || 'Toptan Alışverişe Geç'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center justify-center p-8 bg-surface-secondary/20 text-xs text-text-muted">
            Toptan vitrini şu anda devre dışı.
          </div>
        )}
      </div>
    </section>
  );
}
