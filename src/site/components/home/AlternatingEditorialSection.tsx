import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export function AlternatingEditorialSection() {
  return (
    <section className="w-full bg-canvas-subtle overflow-hidden border-b border-border-subtle">
      {/* Block 1: Image Left / Text Right (Reference 02) */}
      <div className="border-b border-border-subtle">
        <Container size="lg" className="py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Image Left (6 cols) */}
            <div className="lg:col-span-6">
              <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-surface-secondary shadow-card">
                <img
                  src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85"
                  alt="Vazo Studio Yeni Koleksiyon Seramik Formlar"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Copy Right (6 cols) */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                Yeni Koleksiyon
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary leading-[1.15]">
                Formun sadeliği, mekâna anlam katar.
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans font-normal max-w-lg">
                Zamana meydan okuyan tasarımları ve doğal mineral malzemeleri buluşturarak yaşam alanlarınıza sade ve güçlü bir estetik kazandırıyoruz.
              </p>
              <div className="pt-2">
                <Link
                  to="/collections/nordik-sessizlik"
                  className="inline-flex items-center gap-2 bg-brand-taupe/40 hover:bg-brand-taupe/60 text-text-primary px-8 py-3.5 text-xs uppercase font-semibold tracking-wider transition-colors"
                >
                  <span>Keşfet</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Block 2: Text Left / Image Right (Reference 02) */}
      <div>
        <Container size="lg" className="py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Copy Left (6 cols) */}
            <div className="lg:col-span-6 space-y-6 text-left order-2 lg:order-1">
              <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                El Yapımı Seramik
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary leading-[1.15]">
                Doğadan ilham alan özgün tasarımlar.
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans font-normal max-w-lg">
                Her bir parça, usta ellerde el tornasında şekillenir ve 1250°C fırınlama ile kendine has yüzey dokusu ve ton farklılıklarına kavuşur.
              </p>
              <div className="pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 border border-text-primary text-text-primary hover:bg-action-primary hover:text-action-primary-text px-8 py-3.5 text-xs uppercase font-semibold tracking-wider transition-colors"
                >
                  <span>Koleksiyonu İncele</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Image Right (6 cols) */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-surface-secondary shadow-card">
                <img
                  src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=85"
                  alt="Doğal Mineralli Heykelsi Seramik Vazo"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
