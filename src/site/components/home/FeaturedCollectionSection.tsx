import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export function FeaturedCollectionSection() {
  return (
    <section className="w-full bg-canvas-default py-16 md:py-24 border-b border-border-subtle">
      <Container size="lg">
        <div className="relative overflow-hidden bg-surface-secondary border border-border-subtle p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Image (7 cols) */}
            <div className="lg:col-span-7">
              <div className="aspect-[16/10] w-full overflow-hidden bg-surface-muted">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"
                  alt="Nordik Sessizlik ve Amforik Kıvrımlar Koleksiyonu"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Right Copy (5 cols) */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                Sezonun İmza Koleksiyonu
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-text-primary leading-tight">
                Nordik Sessizlik & Amforik Kıvrımlar
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
                Kuzey doğasının yalın sükuneti ile Akdeniz heykelsi seramik mirasını bir araya getiren 2026 koleksiyonumuz; mekanlarınıza dingin bir karakter kazandırıyor.
              </p>
              <div className="pt-2">
                <Link
                  to="/collections/nordik-sessizlik"
                  className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-8 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  <span>Koleksiyonu Keşfet</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
