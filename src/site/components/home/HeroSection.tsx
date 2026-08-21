import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { contentRepository } from '@/entities/content/api/content-repository';
import { HeroBannerConfig } from '@/entities/content/types';
import { Container } from '@/shared/ui/Container';

export function HeroSection() {
  const [hero, setHero] = useState<HeroBannerConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'retail' | 'wholesale'>('retail');

  useEffect(() => {
    contentRepository.getHero().then((data) => setHero(data));
  }, []);

  if (!hero) {
    return (
      <div className="w-full bg-canvas-warm py-24 md:py-36 animate-pulse">
        <Container>
          <div className="h-64 bg-surface-muted max-w-xl" />
        </Container>
      </div>
    );
  }

  return (
    <section className="relative w-full bg-canvas-warm overflow-hidden border-b border-border-subtle">
      <Container size="lg" className="py-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text Content (Left Column) */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8 text-left z-10">
            {/* Dual Mode Switcher (Reference 05) */}
            <div className="inline-flex p-1 bg-surface-secondary border border-border-default select-none">
              <button
                type="button"
                onClick={() => setActiveTab('retail')}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'retail'
                    ? 'bg-action-primary text-action-primary-text shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Perakende
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('wholesale')}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'wholesale'
                    ? 'bg-action-primary text-action-primary-text shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Toptan & B2B
              </button>
            </div>

            {/* Main Editorial Title */}
            <div className="space-y-4 max-w-xl">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-text-primary leading-[1.08] tracking-tight">
                {activeTab === 'retail' ? (
                  <>
                    Modern Formlar.{' '}
                    <span className="block font-normal italic text-text-secondary">
                      Zamansız Dokunuşlar.
                    </span>
                  </>
                ) : (
                  <>
                    Mimari Projeler &{' '}
                    <span className="block font-normal italic text-text-secondary">
                      Özel B2B Çözümler.
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans font-normal max-w-lg">
                {activeTab === 'retail'
                  ? 'İlhamını doğadan ve sadelikten alan el işçiliği vazo koleksiyonlarımızla yaşam alanlarınıza zarif bir denge katın.'
                  : 'İç mimarlar, oteller ve seçkin mağazalar için heykelsi seramik vazo üretimi, hacimli alım avantajları ve özel sır seçenekleri.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                to={activeTab === 'retail' ? '/products' : '/wholesale'}
                className="inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-8 py-4 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>{activeTab === 'retail' ? 'Alışverişe Başla' : 'Toptan Kataloğu İncele'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to={activeTab === 'retail' ? '/wholesale' : '/wholesale/apply'}
                className="inline-flex items-center justify-center gap-2 border border-border-strong text-text-primary bg-surface-primary/70 hover:bg-surface-primary px-8 py-4 text-xs uppercase font-semibold tracking-wider transition-colors"
              >
                <span>{activeTab === 'retail' ? 'Toptan Satış & B2B' : 'Ticari Hesap Başvurusu'}</span>
              </Link>
            </div>
          </div>

          {/* Large Styled Vase Imagery (Right Column) */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[5/4] w-full overflow-hidden bg-surface-secondary shadow-card">
              <img
                src={
                  activeTab === 'retail'
                    ? 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85'
                    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85'
                }
                alt="Vazo Studio Koleksiyonu"
                className="w-full h-full object-cover object-center transition-all duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
