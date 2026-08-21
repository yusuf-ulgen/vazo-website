import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function EditorialStorySection() {
  return (
    <section className="py-20 bg-canvas-warm border-b border-border-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Story Image (6 columns) */}
          <div className="lg:col-span-6">
            <div className="aspect-[4/5] w-full bg-surface-muted overflow-hidden shadow-elevated">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
                alt="El Yapımı Seramik Stüdyosu"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Story Text (6 columns) */}
          <div className="lg:col-span-6 space-y-6 lg:pl-6">
            <span className="text-xs uppercase tracking-editorial font-semibold text-text-secondary block">
              Zanaat & Felsefe
            </span>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-text-primary leading-tight font-light">
              Toprağın Doğallığı, <br />
              <span className="font-normal italic">Mimari Heykelsilik.</span>
            </h2>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans font-normal">
              Her bir parça, mineral zengini stoneware kilinin geleneksel el tornasında şekillendirilmesi ve 1250°C fırınlama ile monolitik dayanıklılığa kavuşmasıyla üretilir.
            </p>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans font-normal">
              Seri üretimin tekdüzeliğinden uzak; her vazoda hafif ton ve doku farklılıkları barındıran özgün bir karaktere sahiptir.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide bg-action-primary text-action-primary-text px-6 py-3 hover:bg-neutral-800 transition-colors"
              >
                <span>Stüdyo Hikayemiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/collections/amphoric-curves"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide bg-transparent border border-text-primary text-text-primary px-6 py-3 hover:bg-neutral-100 transition-colors"
              >
                <span>Koleksiyonu İncele</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
