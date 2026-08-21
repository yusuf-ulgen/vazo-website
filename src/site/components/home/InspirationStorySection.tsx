import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export function InspirationStorySection() {
  return (
    <section className="w-full bg-canvas-subtle py-16 md:py-24 border-b border-border-subtle">
      <Container size="lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Left (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              İlham & Atölye
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary leading-[1.15]">
              Formun sadeliğinde anlamı bulduk.
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
              Vazo Studio, doğadan, zamandan ve kültürel izlerden ilham alarak mekanlara sessiz bir asalet katan özgün heykelsi seramikler tasarlar ve üretir.
            </p>
            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-primary underline underline-offset-8 hover:text-text-secondary transition-colors"
              >
                <span>Hikayemizi Okuyun</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Image Right (7 cols) */}
          <div className="lg:col-span-7">
            <div className="aspect-[16/10] w-full overflow-hidden bg-surface-secondary shadow-card">
              <img
                src="https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1200&q=85"
                alt="Vazo Studio İlham ve Seramik Zanaatı"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
