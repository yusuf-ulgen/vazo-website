import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export function ProductAccordions() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const accordions = [
    {
      title: 'Teknik Detaylar & Bakım',
      content:
        'Yüksek derecede (1250°C) fırınlanmış stoneware seramik gövde. Dış yüzey doğal mineral mat sır ile kaplıdır. Su geçirimsiz iç sırlama sayesinde taze çiçeklerle ve su ile kullanıma uygundur. Temizlik için ılık su ve yumuşak bez kullanılması önerilir.',
    },
    {
      title: 'Kargo, Paketleme & Sevkiyat',
      content:
        'Siparişleriniz, seramik objelerin taşınması için özel tasarlanmış koruyucu ambalajlarla paketlenir. Anlaşmalı kargo firmaları aracılığıyla 1-3 iş günü içinde sigortalı olarak sevk edilir.',
    },
    {
      title: 'Sıkça Sorulan Sorular',
      content:
        'Vazolarımız %100 su sızdırmazdır. Kurumsal ve toptan alımlarda özel renk ve sır varyasyonları üretilebilmektedir. Detaylı sorularınız için bize her zaman ulaşabilirsiniz.',
    },
  ];

  return (
    <section className="w-full bg-canvas-default py-8 border-b border-border-subtle">
      <Container size="lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {accordions.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.title} className="border border-border-default bg-surface-secondary/30 p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-sans text-xs font-semibold uppercase tracking-wider text-text-primary hover:text-text-secondary transition-colors"
                >
                  <span>{item.title}</span>
                  {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
                {isOpen && (
                  <p className="text-[11px] text-text-secondary leading-relaxed font-sans pt-2 border-t border-border-subtle animate-fade-in">
                    {item.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
