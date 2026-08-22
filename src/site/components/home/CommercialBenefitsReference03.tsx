import { Tag, Boxes, Award, Truck, Headphones } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export function CommercialBenefitsReference03() {
  const benefits = [
    {
      icon: Tag,
      title: 'Özel Toptan Fiyatlar',
      description: 'Hacminize özel avantajlı fiyatlandırma.',
    },
    {
      icon: Boxes,
      title: 'Geniş Ürün Yelpazesi',
      description: 'Farklı koleksiyon ve boyut seçenekleri.',
    },
    {
      icon: Award,
      title: 'Kaliteli & Dayanıklı Ürünler',
      description: 'Uzun ömürlü, estetik ve premium üretim.',
    },
    {
      icon: Truck,
      title: 'Hızlı & Güvenli Teslimat',
      description: 'Zamanında teslimat ve özenli paketleme.',
    },
    {
      icon: Headphones,
      title: 'Profesyonel Destek',
      description: 'Sipariş öncesi ve sonrası uzman desteği.',
    },
  ];

  return (
    <section className="w-full bg-canvas-default py-12 md:py-16 border-b border-border-subtle">
      <Container size="lg">
        {/* Section Header (Reference 03) */}
        <div className="text-center max-w-xl mx-auto space-y-1 mb-10 md:mb-12">
          <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
            NEDEN VAZO STUDIO?
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-text-primary">
            Ticari Avantajlarınız
          </h2>
        </div>

        {/* 5-Column Grid with delicate vertical dividers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 lg:divide-x divide-border-subtle">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="flex flex-col items-center text-center p-4 sm:p-6 space-y-2.5"
              >
                <div className="w-10 h-10 rounded-full bg-surface-secondary border border-border-subtle flex items-center justify-center text-text-primary mb-1">
                  <Icon className="w-4 h-4 stroke-[1.5]" />
                </div>
                <h3 className="font-sans text-xs font-semibold text-text-primary">
                  {b.title}
                </h3>
                <p className="text-[11px] text-text-secondary font-sans leading-relaxed max-w-[180px]">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
