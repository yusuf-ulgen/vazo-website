import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { contentRepository } from '@/entities/content/api/content-repository';
import type { SplitHeroConfig } from '@/entities/content/types';

export function SplitHeroReference03() {
  const [splitHero, setSplitHero] = useState<SplitHeroConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mobile slider state: 0 = Retail (Perakende), 1 = Wholesale (Toptan)
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch gesture support for mobile swiping
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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

  // 5-second autoplay loop for mobile slider
  const nextSlide = useCallback(() => {
    setActiveMobileIndex((prev) => (prev === 0 ? 1 : 0));
  }, []);

  const prevSlide = useCallback(() => {
    setActiveMobileIndex((prev) => (prev === 0 ? 1 : 0));
  }, []);

  useEffect(() => {
    if (isPaused || isLoading || errorMessage) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, isLoading, errorMessage, nextSlide, activeMobileIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      touchStartX.current = e.targetTouches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      touchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    // 40px swipe threshold
    if (diff > 40) {
      nextSlide();
    } else if (diff < -40) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

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
    <section
      className="w-full bg-canvas-default border-b border-border-subtle overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Top Controls: Segmented Indicator Pills & Navigation (lg:hidden) */}
      <div className="lg:hidden flex items-center justify-between px-4 sm:px-6 pt-3.5 pb-2 bg-canvas-default/95 border-b border-border-subtle/50">
        {/* Segmented Switcher Pills */}
        <div className="inline-flex items-center p-1 rounded-full bg-surface-secondary border border-border-subtle shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMobileIndex(0)}
            className={`px-4 py-1 text-[11px] font-semibold tracking-wider uppercase rounded-full transition-all duration-300 ${
              activeMobileIndex === 0
                ? 'bg-action-primary text-action-primary-text shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Perakende
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileIndex(1)}
            className={`px-4 py-1 text-[11px] font-semibold tracking-wider uppercase rounded-full transition-all duration-300 ${
              activeMobileIndex === 1
                ? 'bg-action-primary text-action-primary-text shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Toptan
          </button>
        </div>

        {/* Prev / Next Chevrons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Önceki vitrin"
            className="w-7 h-7 rounded-full bg-surface-primary border border-border-subtle flex items-center justify-center text-text-primary hover:bg-surface-secondary active:scale-95 transition-all shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Sonraki vitrin"
            className="w-7 h-7 rounded-full bg-surface-primary border border-border-subtle flex items-center justify-center text-text-primary hover:bg-surface-secondary active:scale-95 transition-all shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: BİREYSEL ALIŞVERİŞ (Perakende) */}
        {retail && retail.active ? (
          <div
            key={activeMobileIndex === 0 ? 'retail-active' : 'retail-inactive'}
            className={`relative min-h-[480px] sm:min-h-[520px] lg:min-h-[580px] flex-col justify-center p-6 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden group ${
              activeMobileIndex === 0 ? 'flex animate-hero-slide' : 'hidden lg:flex'
            }`}
          >
            {/* Background Image: right-focal positioning prevents vases from being cropped on mobile */}
            <div className="absolute inset-0 z-0">
              <img
                src={retail.imageUrl}
                alt={retail.title || 'Perakende Vazo Koleksiyonu'}
                className="w-full h-full object-cover object-[78%_center] lg:object-[80%_center] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-canvas-default/95 via-canvas-default/65 to-transparent/10 sm:from-canvas-default/75 sm:via-canvas-default/30" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 space-y-4 max-w-[260px] sm:max-w-md text-left">
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
          <div
            className={`min-h-[480px] sm:min-h-[520px] lg:min-h-[580px] items-center justify-center p-8 border-b lg:border-b-0 lg:border-r border-border-subtle bg-surface-secondary/20 text-xs text-text-muted ${
              activeMobileIndex === 0 ? 'flex' : 'hidden lg:flex'
            }`}
          >
            Perakende vitrini şu anda devre dışı.
          </div>
        )}

        {/* Right Column: PROFESYONEL ALIŞVERİŞ (Toptan) */}
        {wholesale && wholesale.active ? (
          <div
            key={activeMobileIndex === 1 ? 'wholesale-active' : 'wholesale-inactive'}
            className={`relative min-h-[480px] sm:min-h-[520px] lg:min-h-[580px] flex-col justify-center p-6 sm:p-12 lg:p-16 overflow-hidden group ${
              activeMobileIndex === 1 ? 'flex animate-hero-slide' : 'hidden lg:flex'
            }`}
          >
            {/* Background Image: right-focal positioning prevents artwork from being cropped on mobile */}
            <div className="absolute inset-0 z-0">
              <img
                src={wholesale.imageUrl}
                alt={wholesale.title || 'Toptan Seramik Proje ve Mimari Çözümler'}
                className="w-full h-full object-cover object-[78%_center] lg:object-[80%_center] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-canvas-default/95 via-canvas-default/65 to-transparent/10 sm:from-canvas-default/75 sm:via-canvas-default/30" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 space-y-4 max-w-[260px] sm:max-w-md text-left">
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
          <div
            className={`min-h-[480px] sm:min-h-[520px] lg:min-h-[580px] items-center justify-center p-8 bg-surface-secondary/20 text-xs text-text-muted ${
              activeMobileIndex === 1 ? 'flex' : 'hidden lg:flex'
            }`}
          >
            Toptan vitrini şu anda devre dışı.
          </div>
        )}
      </div>

      {/* Mobile 5-Second Looping Progress Indicator Bar (lg:hidden) */}
      <div className="lg:hidden w-full bg-border-subtle/60 h-1 overflow-hidden">
        <div
          key={`progress-${activeMobileIndex}-${isPaused}`}
          className="h-full bg-action-primary transition-all"
          style={{
            animation: isPaused ? 'none' : 'heroProgress 5s linear forwards',
          }}
        />
      </div>
    </section>
  );
}
