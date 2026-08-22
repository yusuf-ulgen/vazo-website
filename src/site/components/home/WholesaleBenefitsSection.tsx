import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Boxes,
  Truck,
  Headphones,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { contentRepository, WholesaleBenefit } from '@/entities/content/api/content-repository';
import { Container } from '@/shared/ui/Container';

export function WholesaleBenefitsSection() {
  const [benefits, setBenefits] = useState<WholesaleBenefit[]>([]);

  useEffect(() => {
    contentRepository.getWholesaleBenefits().then((data) => setBenefits(data));
  }, []);

  const defaultBenefits = [
    {
      icon: Tag,
      title: 'Özel Toptan Fiyatlar',
      description: 'Hacimli siparişlerinizde %50\'ye varan toptan kademeli fiyat avantajı.',
    },
    {
      icon: Boxes,
      title: 'Geniş Ürün Yelpazesi',
      description: 'Masa üstü, zemin ve heykelsi seramiklerde zengin koleksiyon.',
    },
    {
      icon: Truck,
      title: 'Hızlı & Güvenli Teslimat',
      description: 'Kırılmaya karşı sigortalı, özel köpüklü sandıklı sevkiyat.',
    },
    {
      icon: Headphones,
      title: 'Profesyonel Toptan Destek',
      description: 'İç mimarlar ve kurumsal projeler için özel müşteri temsilcisi.',
    },
  ];

  return (
    <section className="w-full bg-canvas-warm py-16 md:py-24 border-b border-border-subtle">
      <Container size="lg">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12 md:mb-16">
          <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
            Toptan Avantajlar
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-text-primary">
            Ticari Ortaklarımıza Özel Avantajlar
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
            İç mimarlar, otel projeleri ve perakende satış noktaları için esnek ve güvenilir üretim çözümleri.
          </p>
        </div>

        {/* Benefits Grid (4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {(benefits.length > 0 ? benefits : defaultBenefits).map((b, idx) => {
            const IconComponent =
              'icon' in b ? (b.icon as typeof Tag) : defaultBenefits[idx % 4]?.icon || ShieldCheck;

            return (
              <div
                key={b.title}
                className="flex flex-col items-center text-center space-y-3 p-6 bg-surface-primary/80 border border-border-subtle"
              >
                <div className="w-12 h-12 rounded-full bg-surface-secondary border border-border-default flex items-center justify-center text-text-primary mb-1">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base text-text-primary font-medium">
                  {b.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans font-normal">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Bar */}
        <div className="mt-12 text-center">
          <Link
            to="/wholesale/apply"
            className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-8 py-4 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <span>Toptan Satışa Başvur</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
