import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function RetailWholesaleSplitSection() {
  return (
    <section className="w-full bg-canvas-default border-b border-border-subtle">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Retail / Bireysel Alışveriş (Reference 03) */}
        <div className="relative group overflow-hidden bg-surface-secondary border-b lg:border-b-0 lg:border-r border-border-subtle min-h-[420px] sm:min-h-[500px] flex flex-col justify-end p-8 sm:p-12 lg:p-16">
          {/* Background Photography with Gentle Gradient */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85"
              alt="Perakende Yaşam Alanı Vazo Koleksiyonu"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 space-y-4 max-w-md text-white text-left">
            <span className="text-xs uppercase font-semibold tracking-editorial text-neutral-300">
              Bireysel Alışveriş
            </span>
            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">
              Perakende
            </h3>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans font-normal">
              Evinize ve yaşam alanlarınıza estetik dokunuşlar katacak heykelsi vazo koleksiyonlarımızı keşfedin.
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-white text-neutral-900 px-7 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-100 transition-colors shadow-xs"
              >
                <span>Alışverişe Başla</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Wholesale / Profesyonel Alışveriş (Reference 03) */}
        <div className="relative group overflow-hidden bg-surface-muted min-h-[420px] sm:min-h-[500px] flex flex-col justify-end p-8 sm:p-12 lg:p-16">
          {/* Background Photography with Gentle Gradient */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"
              alt="Toptan ve Mimari Proje Seramik Çözümleri"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 space-y-4 max-w-md text-white text-left">
            <span className="text-xs uppercase font-semibold tracking-editorial text-neutral-300">
              Profesyonel & Kurumsal
            </span>
            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">
              Toptan
            </h3>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans font-normal">
              İç mimarlar ve otel/restoran projeleri için özel hacim iskontoları, geniş ürün seçeneği ve numune desteği.
            </p>
            <div className="pt-2">
              <Link
                to="/wholesale"
                className="inline-flex items-center gap-2 border border-white text-white hover:bg-white hover:text-neutral-900 px-7 py-3.5 text-xs uppercase font-semibold tracking-wider transition-colors shadow-xs"
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
