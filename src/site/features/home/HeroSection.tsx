import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative bg-canvas-subtle border-b border-border-default overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Editorial Text (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-muted text-text-secondary text-xs uppercase font-semibold tracking-editorial">
            <span>2026 Koleksiyonu</span>
            <span className="w-1 h-1 rounded-full bg-text-secondary" />
            <span>Heykelsi Seramikler</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text-primary leading-[1.08] font-light tracking-tight">
            Sessizliğin ve Ham Dokunun <br className="hidden sm:inline" />
            <span className="font-normal italic">Mimari Formu.</span>
          </h1>

          <p className="text-sm md:text-base text-text-secondary max-w-xl leading-relaxed font-sans font-normal">
            İskandinav yalınlığı ile el işçiliği seramik zanaatını buluşturan koleksiyonumuz; yaşam alanları, butik oteller ve mimari projeler için heykelsi bir dinginlik sunar.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-8 py-4 text-xs uppercase font-semibold tracking-wide hover:bg-neutral-800 transition-colors"
            >
              <span>Perakende Koleksiyonu Keşfet</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/wholesale"
              className="inline-flex items-center justify-center gap-2 bg-surface-primary border border-text-primary text-text-primary px-8 py-4 text-xs uppercase font-semibold tracking-wide hover:bg-surface-secondary transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Toptan & Proje Teklifi Al</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="pt-8 grid grid-cols-3 gap-6 border-t border-border-subtle max-w-lg">
            <div>
              <span className="block font-display text-2xl font-normal text-text-primary">100%</span>
              <span className="text-[11px] text-text-secondary uppercase tracking-wider">El Yapımı Stoneware</span>
            </div>
            <div>
              <span className="block font-display text-2xl font-normal text-text-primary">B2B</span>
              <span className="text-[11px] text-text-secondary uppercase tracking-wider">Kademeli Fiyat & MOQ</span>
            </div>
            <div>
              <span className="block font-display text-2xl font-normal text-text-primary">Global</span>
              <span className="text-[11px] text-text-secondary uppercase tracking-wider">Güvenli Ahşap Sandık</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Imagery (5 columns) */}
        <div className="lg:col-span-5 relative">
          <div className="aspect-[3/4] w-full bg-surface-muted overflow-hidden shadow-elevated border border-border-subtle">
            <img
              src="https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1000&q=85"
              alt="İskandinav Tasarım Vazo Koleksiyonu"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </div>

          {/* Floating Subtle Card */}
          <div className="absolute -bottom-6 -left-6 bg-surface-primary/95 backdrop-blur-sm border border-border-default p-4 shadow-card hidden sm:block max-w-xs">
            <p className="text-[11px] uppercase tracking-editorial text-text-secondary font-semibold">
              Koleksiyon Parçası
            </p>
            <p className="font-display text-base text-text-primary">Amforik Taş Vazo No: 04</p>
            <p className="text-xs text-feedback-success font-medium mt-1">
              Perakende & Toptan Stokta
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
