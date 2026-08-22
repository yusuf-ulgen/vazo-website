import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function SplitHeroReference03() {
  return (
    <section className="w-full bg-canvas-default border-b border-border-subtle overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: BİREYSEL ALIŞVERİŞ (Perakende) */}
        <div className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex flex-col justify-center p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden group">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/hero-retail.jpg"
              alt="Perakende Vazo Koleksiyonu"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-canvas-default/60 via-transparent to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 space-y-4 max-w-md text-left">
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              BİREYSEL ALIŞVERİŞ
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-text-primary leading-tight">
              Perakende
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal max-w-sm">
              Evinize estetik dokunuşlar katacak vazo koleksiyonlarımızı keşfedin.
            </p>
            <div className="pt-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-7 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>Alışverişe Başla</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: PROFESYONEL ALIŞVERİŞ (Toptan) */}
        <div className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex flex-col justify-center p-8 sm:p-12 lg:p-16 overflow-hidden group">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/hero-wholesale.jpg"
              alt="Toptan Seramik Proje ve Mimari Çözümler"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-canvas-default/60 via-transparent to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 space-y-4 max-w-md text-left">
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              PROFESYONEL ALIŞVERİŞ
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-text-primary leading-tight">
              Toptan
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal max-w-sm">
              Projeleriniz için özel fiyatlar, geniş ürün seçeneği ve profesyonel destek alın.
            </p>
            <div className="pt-3">
              <Link
                to="/wholesale"
                className="inline-flex items-center gap-2 border border-text-primary bg-surface-primary/90 text-text-primary hover:bg-action-primary hover:text-action-primary-text px-7 py-3.5 text-xs uppercase font-semibold tracking-wider transition-colors shadow-xs"
              >
                <span>Toptan Alışverişe Geç</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
